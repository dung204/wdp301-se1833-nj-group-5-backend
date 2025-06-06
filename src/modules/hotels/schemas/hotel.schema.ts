import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BaseSchema } from '@/base/schemas';
import { User } from '@/modules/users/schemas/user.schema';

// Định nghĩa interface cho checkinTime
class CheckinTimeRange {
  @Prop({ type: Date, required: true })
  from!: Date;

  @Prop({ type: Date, required: true })
  to!: Date;
}
@Schema()
export class Hotel extends BaseSchema {
  @Prop({
    type: String,
    required: true,
    length: 256,
  })
  name!: string;

  @Prop({
    type: String,
    required: true,
  })
  address!: string;

  @Prop({
    type: String,
    required: true,
  })
  description!: string;

  @Prop({
    type: String,
    ref: 'User',
  })
  owner!: User;

  @Prop({
    type: String,
    required: true,
  })
  phoneNumber!: string;

  @Prop({
    type: () => CheckinTimeRange,
    required: true,
  })
  checkinTime!: CheckinTimeRange;

  @Prop({
    type: Date,
    required: true,
  })
  checkoutTime!: Date;

  @Prop({
    type: [String],
    default: ['https://example.com/default-avatar.png'],
  })
  avatar!: string[];

  @Prop({
    type: Number,
    required: true,
  })
  rating!: number;

  @Prop({
    type: [String],
    default: [],
  })
  services!: string[]; // Ví dụ: ['wifi', 'pool', 'parking']

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive!: boolean;
}

export const HotelSchema = SchemaFactory.createForClass(Hotel);

HotelSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function (next) {
  this.populate(['owner']);
  next();
});

export type HotelDocument = HydratedDocument<Hotel>;
