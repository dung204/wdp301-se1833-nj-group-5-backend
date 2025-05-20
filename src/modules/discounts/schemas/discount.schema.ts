import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BaseSchema } from '@/base/schemas';

@Schema()
export class Discount extends BaseSchema {
  @Prop({
    type: Number,
    min: 0,
    required: true,
  })
  amount!: number;

  @Prop({
    type: Date,
    required: true,
  })
  expiredTimestamp!: Date;
}

export const DiscountSchema = SchemaFactory.createForClass(Discount);

export type DiscountDocument = HydratedDocument<Discount>;
