import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BaseSchema } from '@/base/schemas';
import { Booking } from '@/modules/bookings/schemas/booking.schema';
import { User } from '@/modules/users/schemas/user.schema';

import { MessageType, SenderType } from '../enums';

@Schema()
export class Message extends BaseSchema {
  @Prop({
    type: String,
    ref: 'Booking',
    required: true,
    index: true,
  })
  booking!: Booking;

  @Prop({
    type: String,
    ref: 'User',
    required: true,
    index: true,
  })
  sender!: User;

  @Prop({
    type: String,
    ref: 'User',
    required: true,
    index: true,
  })
  receiver!: User;

  @Prop({
    type: String,
    enum: Object.values(SenderType),
    required: true,
  })
  senderType!: SenderType;

  @Prop({
    type: String,
    required: true,
    maxlength: 1000,
  })
  content!: string;

  @Prop({
    type: String,
    enum: Object.values(MessageType),
    default: MessageType.TEXT,
  })
  messageType!: MessageType;

  @Prop({
    type: Boolean,
    default: false,
  })
  isRead!: boolean;

  @Prop({
    type: Date,
    required: false,
  })
  readAt?: Date;

  @Prop({
    type: String,
    required: false,
  })
  attachmentUrl?: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Add indexes for better query performance
MessageSchema.index({ booking: 1, createTimestamp: -1 });
MessageSchema.index({ sender: 1, createTimestamp: -1 });
MessageSchema.index({ receiver: 1, isRead: 1 });

// Populate sender and receiver information
MessageSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function (next) {
  this.populate([
    { path: 'sender', select: 'firstName lastName email role' },
    { path: 'receiver', select: 'firstName lastName email role' },
    { path: 'booking', select: 'hotel room checkIn checkOut status orderCode' },
  ]);
  next();
});

export type MessageDocument = HydratedDocument<Message>;
