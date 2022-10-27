import { Injectable } from '@nestjs/common';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { Wallet } from './entities/wallet.entity';
import Web3 from 'web3';
import { lastValueFrom } from 'rxjs';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { Transaction } from 'src/shared/interfaces/transaction';
import { Neo4jService } from '@nhogs/nestjs-neo4j';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private readonly httpService: HttpService,
    // @Inject(Neo4jService )
    private readonly neo4jService: Neo4jService,
  ) {}
  async testWriteNeo4j() {
    const newCat = { name: 'cat' };
    const queryResult = await this.neo4jService.run(
      {
        cypher: 'CREATE (c:`Cat`) SET c=$props RETURN properties(c) AS cat',
        parameters: {
          props: newCat,
        },
      },
      { write: true },
    );

    return queryResult.records[0].toObject().cat;
  }

  async testReadNeo4j() {
    const queryResult = await this.neo4jService.run({
      cypher: 'MATCH (n) RETURN count(n) AS count',
    });
    return queryResult.records[0].get('count') + ' records';
  }

  async crawlWallet() {
    const REST_ENDPIONT =
      'https://mainnet.infura.io/v3/d054692827b7449f9b46577dfa256134';
    const ENDPOINT =
      'wss://mainnet.infura.io/ws/v3/d054692827b7449f9b46577dfa256134';

    const repository = this.walletRepository;
    const wallets = await this.findAll();

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

    const data = subscription.on('data', async (blockHeader) => {
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

      wallets.result.transactions.forEach((tr: string) => {
        web3.eth.getTransaction(tr, async function (err, result: Transaction) {
          const fromAddress = result.from;
          const toAddress = result.to;

          if (fromAddress) {
            if (!adresses.has(fromAddress)) {
              console.log('fromAddress -->', fromAddress);
              adresses.add(fromAddress);
              await repository.save({
                address: fromAddress,
              });
            }
          }

          if (toAddress) {
            if (!adresses.has(toAddress)) {
              console.log('toAddress -->', toAddress);
              adresses.add(toAddress);
              await repository.save({
                address: toAddress,
                type: result.type,
              });
            }
          }
        });
      });
    });

    data.on('changed', (changed) => console.log(changed));
    data.on('error', console.error);

    return 'res_wallets';
  }

  create(createWalletDto: CreateWalletDto) {
    return this.walletRepository.insert(createWalletDto);
  }

  findAll() {
    return this.walletRepository.find();
  }

  update(address: string, updateWalletDto: UpdateWalletDto) {
    return this.walletRepository.update(address, updateWalletDto);
  }

  findOne(address: string) {
    return this.walletRepository.findOneBy({ address });
  }
}
