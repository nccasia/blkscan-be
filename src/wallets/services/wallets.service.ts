import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Neo4jNodeModelService, Neo4jService } from '@nhogs/nestjs-neo4j';
import { SendService } from 'src/wallets/services/send.service';
import { Repository } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import { AddressDto } from '../dto/address.dto';
import { SendDto } from '../dto/send.dto';
import { UpdateWalletDto } from '../dto/update-wallet.dto';
import { CreateWalletDto } from '../dto/create-wallet.dto';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import InputDataDecoder, { InputData } from 'ethereum-input-data-decoder';
import { Transaction } from '../entities/transaction.entity';

@Injectable()
export class WalletsService extends Neo4jNodeModelService<AddressDto> {
  constructor(
    protected readonly neo4jService: Neo4jService,
    readonly sendService: SendService,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  label = 'Wallets';
  timestamp = undefined;
  protected logger = new Logger(WalletsService.name);

  async createWithSendRelationship(
    addressSender: AddressDto,
    addressReceiver: AddressDto,
    send?: SendDto,
  ): Promise<void> {
    const session = this.neo4jService.getSession({ write: true });
    const trans = session.beginTransaction();
    this.create(addressSender, { returns: false }).runTx(trans);
    this.create(addressReceiver, { returns: false }).runTx(trans);
    this.sendService
      .create(send || {}, addressSender, addressReceiver, this, this, {
        returns: false,
      })
      .runTx(trans);
    // this.receiveService
    //   .create({}, props.addressReceiver, props.addressSender, this, this, {
    //     returns: false,
    //   })
    //   .runTx(trans);
    await trans.commit();
    return trans.close();
  }

  async saveGraph(tx: Transaction): Promise<any> {
    const from = tx.from;
    const to = tx.to;
    const val = tx.value;
    let toCalledCount = 1;
    let contractIsFrom: boolean = null;
    let contractFuncName = '';

    if (val === 0) {
      const [abiFrom, abiTo] = await Promise.all([
        this.getAbi(from),
        this.getAbi(to),
      ]);
      contractIsFrom = !!abiFrom;

      abiFrom.length &&
        abiTo.length &&
        console.log(
          'abiFrom, abiTo length',
          abiFrom.length,
          abiTo.length,
          tx.hash,
        );

      const decodeData = this.decodeData(
        contractIsFrom ? abiFrom : abiTo,
        tx.input,
      );
      if (decodeData) {
        contractFuncName = decodeData.method || '';
        decodeData.types.forEach((type, index) => {
          if (type.includes('[]')) {
            toCalledCount += decodeData.inputs?.[index]?.length || 0;
          } else if (type.includes('bytes')) {
            toCalledCount += 1;
          }
        });

        toCalledCount === 1 &&
          decodeData.types.length &&
          console.log(
            `__decodeData.types`,
            tx.hash,
            // toCalledCount,
            decodeData.types,
          );
        !contractFuncName &&
          console.log(`!contractFuncName`, tx.hash, decodeData);
      }
    }

    // const run = (a: any, b: any) => {
    //   a;
    //   b;
    // };
    const rs = await this.neo4jService.run(
      // const rs = run(
      {
        cypher: `MERGE (fromAddress:Address {address: "${from}"})
        ON CREATE
          SET fromAddress.totalValue = ${val},
              fromAddress.count = ${toCalledCount},
              fromAddress.funcName = "${contractIsFrom ? contractFuncName : ''}"
        ON MATCH
          SET fromAddress.totalValue = fromAddress.totalValue + ${val},
              fromAddress.count = fromAddress.count + ${toCalledCount}
        MERGE (toAddress:Address {address: "${to}"})
        ON CREATE
          SET toAddress.totalValue = ${val},
              toAddress.count = ${toCalledCount},
              toAddress.funcName = "${!contractIsFrom ? contractFuncName : ''}"
        ON MATCH
          SET toAddress.totalValue = toAddress.totalValue + ${val},
              toAddress.count = toAddress.count + ${toCalledCount}
        MERGE (fromAddress)-[s:Send {value: ${val}, source: "${from}", target: "${to}", funcName: "${contractFuncName}" }]->(toAddress)
        RETURN fromAddress, toAddress`,
      },
      { write: true },
    );
    return rs;
  }

  async getAbi(address: string): Promise<string> {
    const apiKey = this.configService.get<string>('ETH_SCAN_API_KEY');
    const URL = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${apiKey}`;
    const { data } = await firstValueFrom(
      this.httpService.get(URL).pipe(),
    ).catch(async (error) => {
      console.error('getAbi ~ error', error);
      // await this.stopCrawlsLogError('lastValueFrom', error, subscription);
      return { data: null };
    });

    if (data && data.status === '1') {
      return data.result || '';
    }
    return '';
  }

  decodeData(abi: string, txInput: string): InputData | null {
    if (!abi || !txInput) return null;
    const decoder = new InputDataDecoder(abi);
    return decoder.decodeData(txInput);
  }

  // async saveGraph(
  //   from: string,
  //   to: string,
  //   val: number,
  //   toCalledCount: number,
  // ): Promise<any> {
  //   const rs = await this.neo4jService.run(
  //     {
  //       cypher: `MERGE (fromAddress:Address {address: "${from}"})
  //       ON CREATE
  //         SET fromAddress.totalValue = ${val},
  //             fromAddress.count = 1
  //       ON MATCH
  //         SET fromAddress.totalValue = fromAddress.totalValue + ${val},
  //             fromAddress.count = toAddress.count + ${toCalledCount}
  //       MERGE (toAddress:Address {address: "${to}"})
  //       ON CREATE
  //         SET toAddress.totalValue = ${val},
  //             toAddress.count = 1
  //       ON MATCH
  //         SET toAddress.totalValue = toAddress.totalValue + ${val},
  //             toAddress.count = toAddress.count + ${toCalledCount}
  //       MERGE (fromAddress)-[s:Send {value: ${val}, source: "${from}", target: "${to}" }]->(toAddress)
  //       RETURN fromAddress, toAddress`,
  //     },
  //     { write: true },
  //   );
  //   return rs;
  // }

  async getGraph(limit = 10000, skip = 0) {
    const queryResult = await this.neo4jService.run({
      cypher: `MATCH p=(f:Address)-[r:Send]->(t:Address) 
        RETURN p 
        ORDER BY t.totalValue DESC, t.count DESC, f.totalValue DESC, f.count DESC
        SKIP ${skip} LIMIT ${limit}`,
    });

    const data = queryResult.records.map((data) => data.toObject());
    const key = 'id';
    const nodes = data.map((d) => {
      const startNode = {
        id: d.p.start.properties.address,
        funcName: d.p.start.properties.funcName,
        totalValue:
          typeof d.p.start.properties.totalValue?.low === 'number'
            ? d.p.start.properties.totalValue?.low
            : d.p.start.properties.totalValue,
        count:
          typeof d.p.start.properties.count?.low === 'number'
            ? d.p.start.properties.count?.low
            : d.p.start.properties.count,
      };

      const endNode = {
        id: d.p.end.properties.address,
        funcName: d.p.end.properties.funcName,
        totalValue:
          typeof d.p.end.properties.totalValue?.low === 'number'
            ? d.p.end.properties.totalValue?.low
            : d.p.end.properties.totalValue,
        count:
          typeof d.p.end.properties.count?.low === 'number'
            ? d.p.end.properties.count?.low
            : d.p.end.properties.count,
      };
      return [startNode, endNode];
    });

    const nodesUniqueByKey = [
      ...new Map(nodes.flat().map((item) => [item[key], item])).values(),
    ];

    const links = data.map((d) => {
      return {
        source: d.p.start.properties.address,
        target: d.p.end.properties.address,
      };
    });
    return { nodes: nodesUniqueByKey, links };
  }

  async searchGraph(id: string, limit = 200, skip = 0) {
    const queryResult = await this.neo4jService.run({
      cypher: `MATCH p= (f:Address)-[r:Send] -> (t:Address) WITH p 
        SKIP ${skip} LIMIT ${limit}
        WHERE f.address="${id}" OR t.address="${id}"
        ORDER BY t.totalValue DESC, t.count DESC, f.totalValue DESC, f.count DESC
        RETURN p`,
    });

    const data = queryResult.records.map((data) => data.toObject());
    const key = 'id';
    const nodes = data.map((d) => {
      const startNode = {
        id: d.p.start.properties.address,
        funcName: d.p.start.properties.funcName,
        totalValue: d.p.start.properties.totalValue?.low
          ? d.p.start.properties.totalValue?.low
          : d.p.start.properties.totalValue?.low === 0
          ? 0
          : d.p.start.properties.totalValue,
        count:
          typeof d.p.start.properties.count?.low === 'number'
            ? d.p.start.properties.count?.low
            : d.p.start.properties.count,
      };

      const endNode = {
        id: d.p.end.properties.address,
        funcName: d.p.end.properties.funcName,
        totalValue: d.p.end.properties.totalValue?.low
          ? d.p.end.properties.totalValue?.low
          : d.p.end.properties.totalValue?.low === 0
          ? 0
          : d.p.end.properties.totalValue,
        count:
          typeof d.p.end.properties.count?.low === 'number'
            ? d.p.end.properties.count?.low
            : d.p.end.properties.count,
      };
      return [startNode, endNode];
    });

    const nodesUniqueByKey = [
      ...new Map(nodes.flat().map((item) => [item[key], item])).values(),
    ];

    const links = data.map((d) => {
      return {
        source: d.p.start.properties.address,
        target: d.p.end.properties.address,
      };
    });
    return { nodes: nodesUniqueByKey, links };
  }

  findMany() {
    return this.walletRepository.find();
  }

  createWallet(createWalletDto: CreateWalletDto | CreateWalletDto[]) {
    return this.walletRepository.insert(createWalletDto);
  }

  updateWallet(address: string, updateWalletDto: UpdateWalletDto) {
    return this.walletRepository.update(address, updateWalletDto);
  }

  async findByHasTag(hasTag: boolean, size: number) {
    const result = await this.walletRepository.find({
      where: { hasTag },
      take: size,
    });
    return result;
  }

  async updateManyHasTag(addresses: string[]) {
    if (!addresses.length) return;
    const result = await this.walletRepository.update(addresses, {
      hasTag: true,
    });
    return result;
  }
}
