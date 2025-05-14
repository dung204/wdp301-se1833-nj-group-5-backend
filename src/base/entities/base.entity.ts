import { Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm';

export class BaseEntity {
  @CreateDateColumn({
    type: 'timestamp with time zone',
    precision: 3,
  })
  createTimestamp!: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    precision: 3,
    nullable: true,
  })
  updateTimestamp: Date | null = null;

  @DeleteDateColumn({
    type: 'timestamp with time zone',
    precision: 3,
    nullable: true,
  })
  deleteTimestamp: Date | null = null;

  @Column('uuid')
  createUserId!: string;

  @Column('uuid', { nullable: true })
  updateUserId: string | null = null;

  @Column('uuid', { nullable: true })
  deleteUserId: string | null = null;
}
