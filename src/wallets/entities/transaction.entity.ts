import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ConvertedTransaction } from './convertedTransaction.entity';

@Entity('transactions')
export class Transaction {
  constructor(partial: Partial<Transaction>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  from: string;

  @Column()
  to: string;

  @Column({ type: 'float' })
  value: number;

  @Column({ nullable: true, type: 'bigint' })
  lastUpdate: number;

  @OneToOne(
    () => ConvertedTransaction,
    (convertedTransaction) => convertedTransaction.transaction,
  )
  convertedTransaction: ConvertedTransaction;
}
