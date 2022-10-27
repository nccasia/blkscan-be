import { Wallet } from 'src/modules/wallets/entities/wallet.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
@Entity('tags')
export class Tag extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tag: string;

  @Column({ nullable: true })
  walletAddress: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.tags)
  @JoinColumn({ referencedColumnName: 'address' })
  wallet: Wallet;
}
