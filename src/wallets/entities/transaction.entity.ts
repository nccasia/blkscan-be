import { TransactionType } from 'src/common/interfaces/transaction';
import {
  Column,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConvertedTransaction } from './convertedTransaction.entity';

@Entity('transactions')
export class Transaction {
  constructor(partial: Partial<Transaction>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  blockHash: string;

  @Column({ nullable: true })
  blockNumber: number;

  @Column({ nullable: true })
  chainId: string;

  @Column({ nullable: true })
  gas: number;

  @Column({ nullable: true })
  gasPrice: string;

  @Column()
  hash: string;

  @Column()
  input: string;

  @Column({ nullable: true })
  nonce: number;

  @Column({ nullable: true })
  r: string;

  @Column({ nullable: true })
  s: string;

  @Column({ nullable: true })
  transactionIndex: number;

  @Column({ nullable: true })
  v: string;

  @Column()
  from: string;

  @Column()
  to: string;

  @Column({ type: 'float' })
  value: number;

  @Column({ nullable: true })
  type: TransactionType;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'now()',
    onUpdate: 'now()',
  })
  updatedAt: Date;

  @OneToOne(
    () => ConvertedTransaction,
    (convertedTransaction) => convertedTransaction.transaction,
  )
  convertedTransaction: ConvertedTransaction;
}
