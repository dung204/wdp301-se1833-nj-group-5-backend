import { Prop } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';

export class BaseSchema {
  @Prop({
    type: String,
    default: randomUUID,
    required: false,
  })
  _id!: string;

  @Prop({
    type: Date,
    default: Date.now,
    required: false,
  })
  createTimestamp!: Date;

  @Prop({
    type: Date,
    default: Date.now,
    required: false,
  })
  updateTimestamp!: Date | null;

  @Prop({
    type: Date,
    default: null,
    required: false,
  })
  deleteTimestamp!: Date | null;

  @Prop({
    type: String,
    required: true,
  })
  createUserId!: string;

  @Prop({
    type: String,
    default: null,
    required: false,
  })
  updateUserId: string | null = null;

  @Prop({
    type: String,
    default: null,
    required: false,
  })
  deleteUserId: string | null = null;
}
