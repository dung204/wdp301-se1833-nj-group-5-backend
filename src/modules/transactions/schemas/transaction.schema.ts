import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BaseSchema } from '@/base/schemas';
import { Booking } from '@/modules/bookings/schemas/booking.schema';
import { PaymentMethod } from '@/modules/payment-methods/schemas/payment-method.schema';

@Schema()
export class Transaction extends BaseSchema {
  @Prop({
    type: String,
    ref: 'Booking',
    required: true,
  })
  booking!: Booking;

  @Prop({
    type: Number,
    required: true,
  })
  amount!: number;

  @Prop({
    type: String,
    ref: 'PaymentMethod',
    required: true,
  })
  paymentMethod!: PaymentMethod;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function (next) {
  this.populate(['booking']);
  next();
});

export type TransactionDocument = HydratedDocument<Transaction>;
