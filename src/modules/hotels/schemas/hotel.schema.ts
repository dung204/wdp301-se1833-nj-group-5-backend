import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BaseSchema } from '@/base/schemas';
import { User } from '@/modules/users/schemas/user.schema';

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
}

export const HotelSchema = SchemaFactory.createForClass(Hotel);

HotelSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function (next) {
  this.populate(['owner']);
  next();
});

export type HotelDocument = HydratedDocument<Hotel>;
