import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BaseSchema } from '@/base/schemas';

@Schema()
export class Review extends BaseSchema {
  @Prop({
    type: String,
    ref: 'User',
    required: true,
  })
  user!: string;

  @Prop({
    type: String,
    ref: 'Hotel',
    required: true,
  })
  hotel!: string;

  @Prop({
    type: String,
    required: true,
  })
  content!: string;

  @Prop({
    type: Number,
    min: 1,
    max: 5,
    required: true,
  })
  rating!: number;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function (next) {
  this.populate(['user', 'hotel']);
  next();
});

export type ReviewDocument = HydratedDocument<Review>;
