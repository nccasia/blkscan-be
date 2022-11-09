import { Wallet } from 'src/wallets/entities/wallet.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tags')
export class Tag {
  constructor(partial: Partial<Tag>) {
    Object.assign(this, partial);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tag: string;

  @Column({ nullable: true })
  walletAddress: string;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'now()',
    onUpdate: 'now()',
  })
  updatedAt: Date;

  @ManyToOne(() => Wallet, (wallet) => wallet.tags)
  @JoinColumn({ referencedColumnName: 'address' })
  wallet: Wallet;
}
