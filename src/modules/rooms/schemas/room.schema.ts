import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BaseSchema } from '@/base/schemas';
import { Hotel } from '@/modules/hotels/schemas/hotel.schema';

@Schema()
export class Room extends BaseSchema {
  @Prop({
    type: String,
    required: true,
    length: 256,
  })
  name!: string;

  @Prop({
    type: String,
    ref: 'Hotel',
    required: true,
  })
  hotel!: Hotel;

  @Prop({
    type: Number,
    min: 0,
    required: true,
  })
  rate!: number;

  @Prop({
    type: Number,
    min: 0,
    required: true,
  })
  size!: number;

  @Prop({
    type: Number,
    min: 0,
    requried: true,
  })
  occupancy!: number;

  @Prop({
    type: [String],
    default: [],
    required: false,
  })
  services: string[] = [];

  @Prop({
    type: [String],
    default: [],
    required: false,
  })
  images: string[] = [];

  @Prop({
    type: Number,
    min: 0,
    required: true,
  })
  maxQuantity!: number;
}

export const RoomSchema = SchemaFactory.createForClass(Room);

RoomSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function (next) {
  this.populate(['hotel']);
  next();
});

export type RoomDocument = HydratedDocument<Room>;
