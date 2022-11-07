import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Neo4jNodeModelService, Neo4jService } from '@nhogs/nestjs-neo4j';
import { SendService } from 'src/wallets/services/send.service';
import { Repository } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import { AddressDto } from '../dto/address.dto';
import { SendDto } from '../dto/send.dto';
import Web3 from 'web3';
import { Transaction } from 'src/common/interfaces/transaction';
import { lastValueFrom } from 'rxjs';
import { UpdateWalletDto } from '../dto/update-wallet.dto';
import { CreateWalletDto } from '../dto/create-wallet.dto';

@Injectable()
export class WalletsService extends Neo4jNodeModelService<AddressDto> {
  constructor(
    protected readonly neo4jService: Neo4jService,
    readonly sendService: SendService,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private readonly httpService: HttpService,
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

  async saveGraph(from: string, to: string, val: number): Promise<any> {
    const rs = await this.neo4jService.run(
      {
        cypher: `MERGE (fromAddress:Address {address: "${from}"})
        ON CREATE
          SET fromAddress.totalValue = ${val}
        ON MATCH
          SET fromAddress.totalValue = fromAddress.totalValue + ${val}
        MERGE (toAddress:Address {address: "${to}"})
        ON CREATE
          SET toAddress.totalValue = ${val}
        ON MATCH
          SET toAddress.totalValue = toAddress.totalValue + ${val}
        MERGE (fromAddress)-[s:Send {value: ${val}, source: "${from}", target: "${to}" }]->(toAddress)
        RETURN fromAddress, toAddress`,
      },
      { write: true },
    );
    return rs;
  }

  async getGraph(limit = 10000) {
    const queryResult = await this.neo4jService.run({
      cypher: `MATCH p=()-[s:Send]->() RETURN p LIMIT ${limit}`,
    });

    const data = queryResult.records.map((data) => data.toObject());
    const key = 'id';
    const nodes = data.map((d) => {
      const startNode = {
        id: d.p.start.properties.address,
        totalValue: d.p.start.properties.totalValue?.low
          ? d.p.start.properties.totalValue?.low
          : d.p.start.properties.totalValue?.low === 0
          ? 0
          : d.p.start.properties.totalValue,
      };

      const endNode = {
        id: d.p.end.properties.address,
        totalValue: d.p.end.properties.totalValue?.low
          ? d.p.end.properties.totalValue?.low
          : d.p.end.properties.totalValue?.low === 0
          ? 0
          : d.p.end.properties.totalValue,
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

  async searchGraph(id: string) {
    const queryResult = await this.neo4jService.run({
      cypher: `MATCH p= (n:Address)-[s:Send] -> (a:Address) where n.address="${id}" OR a.address="${id}" return p`,
    });

    const data = queryResult.records.map((data) => data.toObject());
    const key = 'id';
    const nodes = data.map((d) => {
      const startNode = {
        id: d.p.start.properties.address,
        totalValue: d.p.start.properties.totalValue?.low
          ? d.p.start.properties.totalValue?.low
          : d.p.start.properties.totalValue?.low === 0
          ? 0
          : d.p.start.properties.totalValue,
      };

      const endNode = {
        id: d.p.end.properties.address,
        totalValue: d.p.end.properties.totalValue?.low
          ? d.p.end.properties.totalValue?.low
          : d.p.end.properties.totalValue?.low === 0
          ? 0
          : d.p.end.properties.totalValue,
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

  async crawlWallet() {
    const REST_ENDPIONT =
      'https://mainnet.infura.io/v3/d054692827b7449f9b46577dfa256134';
    const ENDPOINT =
      'wss://mainnet.infura.io/ws/v3/d054692827b7449f9b46577dfa256134';

    // const repository = this.walletRepository;
    const wallets = await this.findMany();

    const adresses = new Set<string>();

    wallets.forEach((wallet) => adresses.add(wallet.address));

    const web3 = new Web3(ENDPOINT);

    const newBlockHeaders = web3.eth.subscribe(
      'newBlockHeaders',
      function (error, result) {
        if (!error) {
          console.log('subscription: ', result);
          return;
        }
        console.error(error);
      },
    );

    const subscription = newBlockHeaders.on(
      'connected',
      function (subscriptionId) {
        console.log('subscriptionId: ', subscriptionId);
      },
    );
    let i = 0;
    const data = subscription.on('data', async (blockHeader) => {
      i++;
      if (i === 7) {
        web3.eth.clearSubscriptions((error: Error, result: boolean) => {
          console.log(result);
        });
      }

      const headers = { 'Content-Type': 'application/json' };
      const dataBody = {
        jsonrpc: '2.0',
        method: 'eth_getBlockByHash',
        params: [blockHeader.hash, false],
        id: 1,
      };
      const res = this.httpService
        .post(REST_ENDPIONT, dataBody, { headers })
        .pipe();

      const { data: wallets } = await lastValueFrom(res);
      const transactions = wallets?.result?.transactions;

      for await (const tr of transactions) {
        await web3.eth.getTransaction(tr, async (err, result: Transaction) => {
          const fromAddress = result.from;
          const toAddress = result.to;
          if (result.to) {
            const value = parseFloat(result.value) / 1000000000000000000;

            await this.saveGraph(fromAddress, toAddress, value);
          }
        });
      }

      // wallets.result.transactions.forEach((tr: string) => {
      //   web3.eth.getTransaction(tr, async (err, result: Transaction) => {
      //     const fromAddress = result.from || 'from';
      //     const toAddress = result.to || 'to';
      //     const value = parseFloat(result.value) / 1000000000000000000;

      //     await this.addressService.saveGraph(fromAddress, toAddress, value);
      // await this.addressService.createWithSendRelationship(
      //   { address: fromAddress },
      //   { address: toAddress },
      //   { volume: 0 },
      // );
      // if (fromAddress) {
      //   if (!adresses.has(fromAddress)) {
      //     console.log('fromAddress -->', fromAddress);
      //     adresses.add(fromAddress);
      //     // await repository.save({
      //     //   address: fromAddress,
      //     // });
      //   }
      // }

      // if (toAddress) {
      //   if (!adresses.has(toAddress)) {
      //     console.log('toAddress -->', toAddress);
      //     adresses.add(toAddress);
      //     // await repository.save({
      //     //   address: toAddress,
      //     //   type: result.type,
      //     // });
      //   }
      // }
      // });
      // });
    });

    data.on('changed', (changed) => console.log(changed));
    data.on('error', console.error);

    return 'res_wallets';
  }

  findMany() {
    return this.walletRepository.find();
  }

  createWallet(createWalletDto: CreateWalletDto) {
    return this.walletRepository.insert(createWalletDto);
  }

  updateWallet(address: string, updateWalletDto: UpdateWalletDto) {
    return this.walletRepository.update(address, updateWalletDto);
  }
}
