import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BaseSchema } from '@/base/schemas';
import { DiscountState } from '@/modules/discounts/enums/discount.enum';
import { Hotel } from '@/modules/hotels/schemas/hotel.schema';

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

  @Prop({
    type: [String],
    default: [],
    ref: 'Hotel',
  })
  applicableHotels!: Hotel[];

  @Prop({
    type: Number,
    required: true,
  })
  maxQualityPerUser!: number;

  @Prop({
    type: Number,
    default: 0,
  })
  usageCount!: number; // số lần discount được sử dụng

  @Prop({
    type: String,
    enum: Object.values(DiscountState),
    required: true,
  })
  state!: string;
}

export const DiscountSchema = SchemaFactory.createForClass(Discount);

DiscountSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function (next) {
  this.populate(['applicableHotels']);
  next();
});

export type DiscountDocument = HydratedDocument<Discount>;
