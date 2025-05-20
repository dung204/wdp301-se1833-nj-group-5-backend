import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BaseSchema } from '@/base/schemas';
import { User } from '@/modules/users/schemas/user.schema';

import { SupportRequestStatus } from '../enums/support-request-status.enum';

@Schema()
export class SupportRequest extends BaseSchema {
  @Prop({
    type: String,
    ref: 'User',
    required: true,
  })
  user!: User;

  @Prop({
    type: String,
    required: true,
  })
  message!: string;

  @Prop({
    type: String,
    enum: Object.values(SupportRequestStatus),
    default: SupportRequestStatus.OPEN,
    required: true,
  })
  status: SupportRequestStatus = SupportRequestStatus.OPEN;

  @Prop({
    type: String,
    ref: 'User',
    default: null,
    required: false,
  })
  assignedTo: User | null = null;

  @Prop({
    type: String,
    default: null,
    required: false,
  })
  reply: string | null = null;
}

export const SupportRequestSchema = SchemaFactory.createForClass(SupportRequest);

SupportRequestSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function (next) {
  this.populate(['user', 'assignedTo']);
  next();
});

export type SupportRequestDocument = HydratedDocument<SupportRequest>;
