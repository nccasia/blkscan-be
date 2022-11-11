import { Injectable, Logger } from '@nestjs/common';

import { DataSource, InsertResult, Repository } from 'typeorm';
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
import { retryPromise } from 'src/common/utils/promise';
import { ConfigService } from '@nestjs/config';
import { sleep } from 'src/common/utils/sleep';
import { BlockHeader } from 'web3-eth';
import { Subscription } from 'web3-core-subscriptions';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);
  private isCrawls = false;
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(ConvertedTransaction)
    private readonly convertedTransRepository: Repository<ConvertedTransaction>,
    private readonly dataSource: DataSource,
    protected readonly neo4jService: Neo4jService,
    private readonly httpService: HttpService,
    private readonly walletService: WalletsService,
    private readonly configService: ConfigService,
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
      this.logger.log('Saved transactionResponse id', transactionResponse.id);
      this.logger.log(
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
      .where(`ct.transactionId IS ${needConverted ? 'NOT' : ''} NULL`)
      .limit(1000);
    this.logger.log(`query ${query.getSql()}`);
    const result = await query.getMany();
    return result;
  }

  getCrawls() {
    return this.isCrawls;
  }

  async crawlsTransactions() {
    try {
      this.isCrawls = true;
      if (!this.isCrawls) return this.isCrawls;

      const apiKey =
        this.configService.get<string>('INFURA_API_KEY') ||
        'd054692827b7449f9b46577dfa256134';
      const REST_ENDPIONT = 'https://mainnet.infura.io/v3/' + apiKey;
      const ENDPOINT = 'wss://mainnet.infura.io/ws/v3/' + apiKey;
      const existedWalletsMap = new Map<string, boolean>();

      const web3 = new Web3(ENDPOINT);
      const wallets = await this.walletService.findMany();
      wallets.forEach((wallet) => {
        existedWalletsMap.set(wallet.address, true);
      });

      let insertTransactions: Partial<Transaction>[] = [];
      const subscription: Subscription<BlockHeader> = web3.eth.subscribe(
        'newBlockHeaders',
        (error, blockHeader) => {
          if (!error) {
            this.logger.log(
              `subscription #${blockHeader?.number}: hash ${
                blockHeader?.hash
              } parent ..${blockHeader?.parentHash?.slice(-6)}`,
            );
            return;
          }
          this.logger.error(error);
        },
      );

      subscription
        .on('connected', (subscriptionId) => {
          this.logger.log(`subscriptionId: ${subscriptionId} `);
        })
        .on('data', async (blockHeader) => {
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

          const { data: wallets } = await lastValueFrom(res).catch(
            async (error) => {
              await this.stopCrawlsLogError(
                'lastValueFrom',
                error,
                subscription,
              );
              throw error;
              // return { data: null };
            },
          );
          const transactions = wallets?.result?.transactions || [];

          if (insertTransactions?.length < 1000) {
            if (!transactions.length) return;
            for (const tx of transactions) {
              try {
                const result = (await web3.eth
                  .getTransaction(tx)
                  .catch(async (error) => {
                    await this.stopCrawlsLogError(
                      'getTransaction',
                      error,
                      subscription,
                    );
                  })) as ITransaction;
                if (!result) return;
                const fromAddress = result.from;
                const toAddress = result.to;
                if (toAddress) {
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
                await sleep(1000);
              } catch (error) {
                await this.stopCrawlsLogError(
                  'for (const tr of transactions)',
                  error,
                  subscription,
                );
              }
            }
          } else {
            const insertWallets: CreateWalletDto[] = [];
            insertTransactions.forEach((tx) => {
              if (!tx) return;
              const fromAddress = tx.from;
              const toAddress = tx.to;
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
                  type: tx.type,
                });
              }
            });

            await Promise.allSettled([
              retryPromise<InsertResult>(() =>
                this.transactionRepository.insert(insertTransactions),
              ),
              retryPromise<InsertResult>(() =>
                this.walletService.createWallet(insertWallets),
              ),
            ]);
            // await this.transactionRepository.insert(insertTransactions);
            // await this.walletService.createWallet(insertWallets);
            insertTransactions = [];
          }
        })
        .on('changed', this.logger.log)
        .on('error', this.logger.error);
    } catch (error) {
      await this.stopCrawlsLogError('crawlWallet', error, null);
    }

    return 'res_wallets';
  }

  async stopCrawlsLogError(
    key: string,
    error: any,
    subscription: Subscription<BlockHeader> | null,
  ) {
    console.log(
      key,
      'code=',
      error?.code,
      'statusCode=',
      error?.statusCode,
      'name=',
      error?.name,
      'message=',
      error?.message,
      'data',
      error?.data,
    );
    if (
      subscription &&
      error &&
      error.message?.includes(
        'daily request count exceeded, request rate limited',
      )
    ) {
      await subscription.unsubscribe((err, isSuccess) => {
        if (isSuccess) {
          console.log(key, 'success unsubscribe');
          this.isCrawls = false;
          return;
        }
      });
    }
  }
}
