import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BaseSchema } from '@/base/schemas';
import { Booking } from '@/modules/bookings/schemas/booking.schema';

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum PaymentMethodEnum {
  COD = 'COD', // Cash on Delivery
  PAYMENT_GATEWAY = 'PAYMENT_GATEWAY', // Payment via payment gateway
}
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
    enum: Object.values(PaymentMethodEnum),
    default: PaymentMethodEnum.PAYMENT_GATEWAY, // Mặc định là thanh toán qua cổng
  })
  paymentMethod!: PaymentMethodEnum;

  @Prop({
    type: String,
    enum: Object.values(TransactionStatus),
    default: TransactionStatus.PENDING,
  })
  status!: TransactionStatus; // Trạng thái của giao dịch

  @Prop({ type: String, required: false, index: true }) // Đánh index để tìm kiếm nhanh
  transactionCode?: string; // Mã giao dịch từ cổng thanh toán

  @Prop({ type: String, required: false })
  paymentGateway?: string;

  @Prop({ type: String, required: false })
  failureReason?: string; // Lý do thất bại nếu có
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function (next) {
  this.populate(['booking']);
  next();
});

export type TransactionDocument = HydratedDocument<Transaction>;
