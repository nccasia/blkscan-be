import { Tag } from 'src/wallets/entities/tag.entity';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('wallets')
export class Wallet {
  constructor(partial: Partial<Wallet>) {
    Object.assign(this, partial);
  }

  @PrimaryColumn()
  address: string;

  @Column({ nullable: true })
  type: number;

  @Column({ nullable: true, type: 'boolean', default: false })
  hasTag: boolean;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'now()',
    onUpdate: 'now()',
  })
  updatedAt: Date;

  @Column({ nullable: true })
  desc: string;

  @OneToMany(() => Tag, (tag) => tag.wallet)
  tags: Tag[];
}
