import { Injectable, Logger } from '@nestjs/common';

import { DataSource, Repository } from 'typeorm';
import { ConvertedTransaction } from '../entities/convertedTransaction.entity';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Neo4jService } from '@nhogs/nestjs-neo4j';
import { Transaction } from '../entities/transaction.entity';
import Web3 from 'web3';
import { WalletsService } from './wallets.service';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(ConvertedTransaction)
    private readonly convertedTransRepository: Repository<ConvertedTransaction>,
    private readonly dataSource: DataSource,
    protected readonly neo4jService: Neo4jService,
    private readonly httpService: HttpService,
    private readonly walletService: WalletsService,
  ) {}

  // TODO: use DTO type
  async createAndConvert(createDto: Transaction) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const transactionResponse = await queryRunner.manager.save(
        Transaction,
        createDto,
      );
      const convTransactionResponse = await queryRunner.manager.save(
        ConvertedTransaction,
        {
          transactionId: transactionResponse.id,
        },
      );
      console.log('Saved transactionResponse id', transactionResponse.id);
      console.log(
        'Saved convTransactionResponse id',
        convTransactionResponse.transactionId,
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      this.logger.error(err);
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async convertMany(ids: number[]) {
    const convertedTrans = this.convertedTransRepository.create(
      ids.map((id) => ({ transactionId: id })),
    );
    return this.convertedTransRepository.save(convertedTrans);
  }

  // TODO: use DTO type
  create(createDto: Transaction) {
    this.transactionRepository.save(createDto);
  }

  findAll() {
    return this.transactionRepository.find();
  }

  async findWithConverted(needConverted: boolean) {
    const query = this.dataSource
      .createQueryBuilder(Transaction, 't')
      .leftJoinAndSelect(ConvertedTransaction, 'ct', 'ct.transactionId = t.id')
      .where(`ct.transactionId IS ${needConverted ? 'NOT' : ''} NULL`);
    this.logger.log(`query ${query.getSql()}`);
    const result = await query.getMany();
    return result;
  }

  async crawlWallet() {
    const REST_ENDPIONT =
      'https://mainnet.infura.io/v3/d054692827b7449f9b46577dfa256134';
    const ENDPOINT =
      'wss://mainnet.infura.io/ws/v3/d054692827b7449f9b46577dfa256134';

    // const repository = this.walletRepository;
    const wallets = await this.walletService.findMany();

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

    let insertData = [];
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
      const transactions = wallets?.result?.transactions;

      if (insertData?.length < 1000) {
        for await (const tr of transactions) {
          await web3.eth.getTransaction(tr, async (err, result: any) => {
            const fromAddress = result.from;
            const toAddress = result.to;
            if (result.to) {
              const value = parseFloat(result.value) / 1000000000000000000;

              insertData.push(
                this.transactionRepository.create({
                  from: fromAddress,
                  to: toAddress,
                  value: value,
                }),
              );
              // await this.saveGraph(fromAddress, toAddress, value);
            }
          });
        }
      } else {
        await this.transactionRepository.save(insertData);
        insertData = [];
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
}
