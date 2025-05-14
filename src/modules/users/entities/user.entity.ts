import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { BaseEntity } from '@/base/entities';
import { Account } from '@/modules/auth/entities/account.entity';

import { Gender } from '../enums/gender.enum';

@Entity({
  schema: 'public',
  name: 'users',
})
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Account, (account) => account.id)
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @Column('varchar', { length: 128, nullable: true })
  fullName: string | null = null;

  @Column('enum', { enum: Gender, enumName: 'Gender', nullable: true })
  gender: Gender | null = null;
}
