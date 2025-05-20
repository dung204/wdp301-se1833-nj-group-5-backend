import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BaseSchema } from '@/base/schemas';
import { Discount } from '@/modules/discounts/schemas/discount.schema';
import { Hotel } from '@/modules/hotels/schemas/hotel.schema';
import { Room } from '@/modules/rooms/schemas/room.schema';
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
    required: true,
  })
  checkOut!: Date;

  @Prop({
    type: String,
    enum: Object.values(BookingStatus),
    default: BookingStatus.NOT_PAID_YET,
    required: false,
  })
  status: BookingStatus = BookingStatus.NOT_PAID_YET;

  @Prop({
    type: Number,
    required: true,
  })
  totalPrice!: number;

  @Prop({
    type: [String],
    ref: 'Discount',
    required: true,
  })
  discounts: Discount[] = [];
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

BookingSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function (next) {
  this.populate(['user', 'hotel', 'room']);
  next();
});

export type BookingDocument = HydratedDocument<Booking>;
