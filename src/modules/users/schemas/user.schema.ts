import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BaseSchema } from '@/base/schemas';
import { Role } from '@/modules/auth/enums/role.enum';
import { Discount } from '@/modules/discounts/schemas/discount.schema';
import { Hotel } from '@/modules/hotels/schemas/hotel.schema';

import { Gender } from '../enums/gender.enum';

@Schema()
export class User extends BaseSchema {
  @Prop({
    type: String,
    required: true,
    unique: true,
    length: 256,
  })
  email!: string;

  @Prop({
    type: String,
    required: true,
  })
  password!: string;

  @Prop({
    type: String,
    enum: Object.values(Role),
    default: Role.CUSTOMER,
    required: false,
  })
  role: Role = Role.CUSTOMER;

  @Prop({
    type: String,
    length: 128,
    required: false,
  })
  fullName?: string;

  @Prop({
    type: [String],
    default: [],
    required: false,
  })
  favouriteHotels: Hotel[] = [];

  @Prop({
    type: [
      {
        _id: { type: String, ref: 'Discount', required: true },
        quantity: { type: Number, required: true },
      },
    ],
    default: [],
    required: false,
  })
  discounts: (Discount & { quantity: number })[] = [];

  @Prop({
    type: String,
    enum: Object.values(Gender),
    required: false,
  })
  gender?: Gender;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function (next) {
  this.populate(['favouriteHotels', 'discounts._id']);
  next();
});

export type UserDocument = HydratedDocument<User>;
