import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BaseSchema } from '@/base/schemas';
import { Discount } from '@/modules/discounts/schemas/discount.schema';
import { CancelEnum } from '@/modules/hotels/enums';
import { Hotel } from '@/modules/hotels/schemas/hotel.schema';
import { Room } from '@/modules/rooms/schemas/room.schema';
import { PaymentMethodEnum } from '@/modules/transactions/schemas/transaction.schema';
import { User } from '@/modules/users/schemas/user.schema';

import { BookingStatus } from '../enums/booking-status.enum';

@Schema()
export class Booking extends BaseSchema {
  @Prop({
    type: String,
    ref: 'User',
    required: true,
  })
  user!: User;

  @Prop({
    type: String,
    ref: 'Hotel',
    required: true,
  })
  hotel!: Hotel;

  @Prop({
    type: String,
    ref: 'Room',
    required: true,
  })
  room!: Room;

  @Prop({
    type: Date,
    required: true,
  })
  checkIn!: Date;

  @Prop({
    type: Date,
    required: false, // check-out date is optional for bookings
  })
  checkOut!: Date;

  @Prop({
    type: String,
    enum: Object.values(BookingStatus),
    default: BookingStatus.CONFIRMED,
    required: false,
  })
  status!: BookingStatus;

  @Prop({
    type: Number,
    required: true,
    unique: true, // Đảm bảo không bao giờ có 2 đơn hàng trùng mã
    index: true, // Đánh index để webhook của PayOS tìm kiếm nhanh
  })
  orderCode!: number; // Đây chính là mã đơn hàng gửi cho PayOS

  @Prop({
    type: Number,
    required: true,
  })
  totalPrice!: number; // price when customer books

  @Prop({
    type: [String],
    ref: 'Discount',
    required: true,
  })
  discount!: Discount; // list of discounts applied to the booking

  @Prop({
    type: String,
    enum: PaymentMethodEnum,
    required: true,
  })
  paymentMethod!: PaymentMethodEnum; // cancellation policy for the booking

  @Prop({
    type: Number,
    required: true,
  })
  quantity!: number; // number of rooms booked

  @Prop({
    type: Number,
    required: true,
  })
  minOccupancy!: number; // minimum occupancy for the booking

  // Add cancellation-related fields
  @Prop({
    type: String,
    enum: CancelEnum,
    required: false,
  })
  cancelPolicy!: CancelEnum; // cancellation policy for the booking

  @Prop({
    type: Date,
    required: false,
  })
  cancelledAt?: Date;

  @Prop({
    type: Number,
    required: false,
  })
  refundAmount?: number;

  @Prop({
    type: String,
    required: false,
  })
  cancellationReason?: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

BookingSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function (next) {
  this.populate(['user', 'hotel', 'room']);
  next();
});

export type BookingDocument = HydratedDocument<Booking>;
