import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { QueryDto, SchemaResponseDto } from '@/base/dtos';
import { HotelResponseDto } from '@/modules/hotels/dtos/hotel.dto';
import { CancelEnum } from '@/modules/hotels/enums';
import { RoomResponseDto } from '@/modules/rooms/dtos/room.dto';
import { UserProfileDto } from '@/modules/users/dtos/user.dtos';

import { BookingStatus } from '../enums/booking-status.enum';

@Exclude()
export class BookingResponseDto extends SchemaResponseDto {
  @ApiProperty({
    description: 'The user who made the booking',
    type: UserProfileDto,
  })
  @Expose()
  @Type(() => UserProfileDto)
  user!: UserProfileDto;

  @ApiProperty({
    description: 'The hotel for the booking',
    type: HotelResponseDto,
  })
  @Expose()
  @Type(() => HotelResponseDto)
  hotel!: HotelResponseDto;

  @ApiProperty({
    description: 'The room ID for the booking',
    type: RoomResponseDto,
  })
  @Expose()
  room!: RoomResponseDto;

  @ApiProperty({
    description: 'Check-in date',
    example: '2024-01-15T14:00:00.000Z',
  })
  @Expose()
  checkIn!: Date;

  @ApiProperty({
    description: 'Check-out date',
    example: '2024-01-18T12:00:00.000Z',
  })
  @Expose()
  checkOut!: Date;

  @ApiProperty({
    description: 'Booking status',
    example: BookingStatus.NOT_PAID_YET,
    enum: BookingStatus,
  })
  @Expose()
  status!: BookingStatus;

  @ApiProperty({
    description: 'Total price of the booking',
    example: 450000,
  })
  @Expose()
  totalPrice!: number;

  @ApiProperty({
    description: 'Cancellation policy applied to this booking',
    example: CancelEnum.REFUND_BEFORE_1_DAY,
    enum: CancelEnum,
  })
  @Expose()
  cancelPolicy!: CancelEnum;

  @ApiProperty({
    description: 'Applied discounts',
    type: [String],
  })
  @Expose()
  discounts!: string[];

  @ApiProperty({
    description: 'Cancellation timestamp',
    example: '2024-01-10T10:00:00.000Z',
    required: false,
  })
  @Expose()
  cancelledAt?: Date;

  @ApiProperty({
    description: 'Refund amount',
    example: 450000,
    required: false,
  })
  @Expose()
  refundAmount?: number;
}

export class CreateBookingDto {
  @ApiProperty({
    description: 'Hotel ID',
    example: '84d67269-7470-4ef1-bfbb-c66e7cf8c955',
  })
  @IsNotEmpty()
  @IsString()
  hotel!: string;

  @ApiProperty({
    description: 'Room ID',
    example: 'cb3703a9-7ef3-4a8d-bf54-5599ce17c107',
  })
  @IsNotEmpty()
  @IsString()
  room!: string;

  @ApiProperty({
    description: 'Check-in date',
    example: '2025-01-15T14:00:00.000Z',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @Transform(({ value }) => {
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      throw new Error('Check-in date must be today or in the future');
    }
    return date;
  })
  checkIn!: Date;

  @ApiProperty({
    description: 'Check-out date',
    example: '2025-01-18T12:00:00.000Z',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @Transform(({ value }) => {
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      throw new Error('Check-in date must be today or in the future');
    }
    return date;
  })
  checkOut!: Date;

  @ApiProperty({
    description: 'Discount IDs to apply',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  discounts?: string[];
}

export class UpdateBookingDto {
  @ApiProperty({
    description: 'Check-in date',
    example: '2024-01-15T14:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  checkIn?: Date;

  @ApiProperty({
    description: 'Check-out date',
    example: '2024-01-18T12:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  checkOut?: Date;

  @ApiProperty({
    description: 'Booking status',
    example: BookingStatus.NOT_PAID_YET,
    enum: BookingStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiProperty({
    description: 'Total price of the booking',
    example: 450000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalPrice?: number;

  @ApiProperty({
    description: 'Discount IDs to apply',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  discounts?: string[];
}

export class BookingQueryDto extends QueryDto {
  @ApiProperty({
    description: 'Filter by booking ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Filter by user ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'Filter by hotel ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  hotelId?: string;

  @ApiProperty({
    description: 'Filter by room ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiProperty({
    description: 'Filter by booking status',
    enum: BookingStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiProperty({
    description: 'Filter by cancellation policy',
    enum: CancelEnum,
    required: false,
  })
  @IsOptional()
  @IsEnum(CancelEnum)
  cancelPolicy?: CancelEnum;

  @ApiProperty({
    description: 'Filter by check-in date',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  checkIn?: Date;

  @ApiProperty({
    description: 'Filter by check-in date (to)',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  checkOut?: Date;

  @ApiProperty({
    description: 'Filter by minimum total price',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiProperty({
    description: 'Filter by maximum total price',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;
}

export class BookingQueryDtoForAdmin extends BookingQueryDto {
  @ApiProperty({
    description: 'Filter by hotel owner ID (admin only)',
    required: false,
  })
  @IsOptional()
  @IsString()
  hotelOwnerId?: string;
}
