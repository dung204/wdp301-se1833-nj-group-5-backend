import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BaseSchema } from '@/base/schemas';
import { Role } from '@/modules/auth/enums/role.enum';
import { User } from '@/modules/users/schemas/user.schema';

import { RequestType, RoleUpgradeRequestStatus } from '../enums/role-upgrade-request.enum';

@Schema()
export class RoleUpgradeRequest extends BaseSchema {
  @Prop({
    type: String,
    ref: 'User',
    required: true,
  })
  user!: User;

  @Prop({
    type: String,
    enum: Object.values(RequestType),
    required: true,
  })
  requestType!: RequestType;

  @Prop({
    type: String,
    enum: Object.values(Role),
    required: true,
  })
  currentRole!: Role;

  @Prop({
    type: String,
    enum: Object.values(Role),
    required: true,
  })
  targetRole!: Role;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  contactInfo!: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  reason!: string;

  @Prop({
    type: String,
    enum: Object.values(RoleUpgradeRequestStatus),
    default: RoleUpgradeRequestStatus.PENDING,
    required: false,
  })
  status!: RoleUpgradeRequestStatus;

  @Prop({
    type: String,
    ref: 'User',
    required: false,
  })
  reviewedBy?: User;

  @Prop({
    type: Date,
    required: false,
  })
  reviewedAt?: Date;

  @Prop({
    type: String,
    trim: true,
    required: false,
  })
  adminNotes?: string;

  @Prop({
    type: String,
    trim: true,
    required: false,
  })
  rejectionReason?: string;
}

export const RoleUpgradeRequestSchema = SchemaFactory.createForClass(RoleUpgradeRequest);

RoleUpgradeRequestSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function (next) {
  this.populate(['user', 'reviewedBy']);
  next();
});

export type RoleUpgradeRequestDocument = HydratedDocument<RoleUpgradeRequest>;
