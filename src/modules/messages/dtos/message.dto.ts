import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

import { QueryDto, SchemaResponseDto } from '@/base/dtos';
import { BookingResponseDto } from '@/modules/bookings/dtos/booking.dto';
import { UserProfileDto } from '@/modules/users/dtos/user.dtos';

import { MessageType, SenderType } from '../enums';

@Exclude()
export class MessageResponseDto extends SchemaResponseDto {
  @ApiProperty({
    description: 'Booking information',
    type: BookingResponseDto,
  })
  @Expose()
  @Type(() => BookingResponseDto)
  booking!: BookingResponseDto;

  @ApiProperty({
    description: 'Message sender',
    type: UserProfileDto,
  })
  @Expose()
  @Type(() => UserProfileDto)
  sender!: UserProfileDto;

  @ApiProperty({
    description: 'Message receiver',
    type: UserProfileDto,
  })
  @Expose()
  @Type(() => UserProfileDto)
  receiver!: UserProfileDto;

  @ApiProperty({
    description: 'Type of sender',
    enum: SenderType,
    example: SenderType.HOTEL_OWNER,
  })
  @Expose()
  senderType!: SenderType;

  @ApiProperty({
    description: 'Message content',
    example: 'Thank you for booking with us! We hope you enjoy your stay.',
  })
  @Expose()
  content!: string;

  @ApiProperty({
    description: 'Type of message',
    enum: MessageType,
    example: MessageType.TEXT,
  })
  @Expose()
  messageType!: MessageType;

  @ApiProperty({
    description: 'Whether the message has been read',
    example: false,
  })
  @Expose()
  isRead!: boolean;

  @ApiProperty({
    description: 'When the message was read',
    example: '2025-06-30T10:00:00.000Z',
    required: false,
  })
  @Expose()
  readAt?: Date;

  @ApiProperty({
    description: 'Attachment URL for images or files',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @Expose()
  attachmentUrl?: string;
}

export class CreateMessageDto {
  @ApiProperty({
    description: 'Booking ID for the conversation',
    example: '84d67269-7470-4ef1-bfbb-c66e7cf8c955',
  })
  @IsNotEmpty()
  @IsString()
  booking!: string;

  @ApiProperty({
    description: 'Receiver user ID',
    example: '84d67269-7470-4ef1-bfbb-c66e7cf8c956',
  })
  @IsNotEmpty()
  @IsString()
  receiver!: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Thank you for booking with us! We hope you enjoy your stay.',
    minLength: 1,
    maxLength: 1000,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;

  @ApiProperty({
    description: 'Type of message',
    enum: MessageType,
    example: MessageType.TEXT,
    required: false,
  })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType = MessageType.TEXT;

  @ApiProperty({
    description: 'Attachment URL for images or files',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf((o) => o.attachmentUrl && o.attachmentUrl.length > 0)
  @IsUrl({}, { message: 'attachmentUrl must be a valid URL' })
  attachmentUrl?: string;
}

export class MessageQueryDto extends QueryDto {
  @ApiProperty({
    description: 'Filter by booking ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  booking?: string;

  @ApiProperty({
    description: 'Filter by sender ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  sender?: string;

  @ApiProperty({
    description: 'Filter by receiver ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  receiver?: string;

  @ApiProperty({
    description: 'Filter by sender type',
    enum: SenderType,
    required: false,
  })
  @IsOptional()
  @IsEnum(SenderType)
  senderType?: SenderType;

  @ApiProperty({
    description: 'Filter by message type',
    enum: MessageType,
    required: false,
  })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;

  @ApiProperty({
    description: 'Filter by read status',
    example: false,
    required: false,
  })
  @IsOptional()
  isRead?: boolean;

  @ApiProperty({
    description: 'Search in message content',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}

@Exclude()
export class ConversationResponseDto {
  @ApiProperty({
    description: 'Booking information',
    type: BookingResponseDto,
  })
  @Expose()
  @Type(() => BookingResponseDto)
  booking!: BookingResponseDto;

  @ApiProperty({
    description: 'Customer information',
    type: UserProfileDto,
  })
  @Expose()
  @Type(() => UserProfileDto)
  customer!: UserProfileDto;

  @ApiProperty({
    description: 'Hotel owner information',
    type: UserProfileDto,
  })
  @Expose()
  @Type(() => UserProfileDto)
  hotelOwner!: UserProfileDto;

  @ApiProperty({
    description: 'Last message in the conversation',
    type: MessageResponseDto,
  })
  @Expose()
  @Type(() => MessageResponseDto)
  lastMessage!: MessageResponseDto;

  @ApiProperty({
    description: 'Total number of messages in conversation',
    example: 5,
  })
  @Expose()
  messageCount!: number;

  @ApiProperty({
    description: 'Number of unread messages for current user',
    example: 2,
  })
  @Expose()
  unreadCount!: number;
}

export class MarkAsReadDto {
  @ApiProperty({
    description: 'Message ID to mark as read',
    example: '84d67269-7470-4ef1-bfbb-c66e7cf8c957',
  })
  @IsNotEmpty()
  @IsString()
  messageId!: string;
}
