import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { BaseEntity } from '@/base/entities';

import { Role } from '../enums/role.enum';

@Entity({
  schema: 'public',
  name: 'accounts',
})
export class Account extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 256, unique: true })
  email!: string;

  @Column('text')
  password!: string;

  @Column('enum', { enum: Role, enumName: 'Role', default: Role.USER })
  role: Role = Role.USER;
}
