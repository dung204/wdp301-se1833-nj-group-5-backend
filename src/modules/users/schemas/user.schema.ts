import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BaseSchema } from '@/base/schemas';
import { Role } from '@/modules/auth/enums/role.enum';

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
    default: Role.USER,
    required: false,
  })
  role: Role = Role.USER;

  @Prop({
    type: String,
    length: 128,
    required: false,
  })
  fullName?: string;

  @Prop({
    type: String,
    enum: Object.values(Gender),
    required: false,
  })
  gender?: Gender;
}

export const UserSchema = SchemaFactory.createForClass(User);

export type UserDocument = HydratedDocument<User>;
