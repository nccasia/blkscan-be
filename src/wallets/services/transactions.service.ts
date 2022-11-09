import { Injectable, Logger } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from '../entities/trans.entity';
import { DataSource, Repository } from 'typeorm';
import { ConvertedTransaction } from '../entities/convertedTransaction.entity';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(ConvertedTransaction)
    private readonly convertedTransRepository: Repository<ConvertedTransaction>,
    private readonly dataSource: DataSource,
  ) {}

  async createAndConvert() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const transactionResponse = await queryRunner.manager.save(Transaction, {
        desc: '',
      });
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

  create() {
    this.transactionRepository.save({ desc: new Date().toISOString() });
  }

  findAll() {
    return this.transactionRepository.find();
  }

  async findAllUnconverted() {
    const query = this.dataSource
      .createQueryBuilder(Transaction, 't')
      .leftJoinAndSelect(ConvertedTransaction, 'ct', 'ct.transactionId = t.id')
      .where('ct.transactionId IS NULL');
    this.logger.log(`query ${query.getSql()}`);
    const result = await query.getMany();
    return result;
  }
}
