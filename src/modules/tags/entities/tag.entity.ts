import { Column, Entity, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';
@Entity('tags')
export class Tag extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tag: string;

  @Column({ nullable: true })
  wallet: string;
}
