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
import { ITransaction } from 'src/common/interfaces/transaction';
import { CreateWalletDto } from '../dto/create-wallet.dto';

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
    const web3 = new Web3(ENDPOINT);

    const wallets = await this.walletService.findMany();
    const existedWalletsMap = new Map<string, boolean>();
    wallets.forEach((wallet) => existedWalletsMap.set(wallet.address, true));

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

    let insertTransactions: Partial<Transaction>[] = [];
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

      if (insertTransactions?.length < 1000) {
        for await (const tr of transactions) {
          await web3.eth.getTransaction(
            tr,
            async (err, result: ITransaction) => {
              const fromAddress = result.from;
              const toAddress = result.to;
              if (result.to) {
                const value = parseFloat(result.value) / 1000000000000000000;

                insertTransactions.push(
                  this.transactionRepository.create({
                    from: fromAddress,
                    to: toAddress,
                    value: value,
                    type: result.type ?? null,
                  }),
                );
                // await this.saveGraph(fromAddress, toAddress, value);
              }
            },
          );
        }
      } else {
        const insertWallets: CreateWalletDto[] = [];
        insertTransactions.forEach((tran) => {
          const fromAddress = tran.from;
          const toAddress = tran.to;
          if (fromAddress && !existedWalletsMap.has(fromAddress)) {
            existedWalletsMap.set(fromAddress, true);
            insertWallets.push({
              address: fromAddress,
            });
          }
          if (toAddress && !existedWalletsMap.has(toAddress)) {
            existedWalletsMap.set(toAddress, true);
            insertWallets.push({
              address: toAddress,
              type: tran.type,
            });
          }
        });

        await this.transactionRepository.insert(insertTransactions);
        await this.walletService.createWallet(insertWallets);

        insertTransactions = [];
      }
    });

    data.on('changed', (changed) => console.log(changed));
    data.on('error', console.error);

    return 'res_wallets';
  }
}
