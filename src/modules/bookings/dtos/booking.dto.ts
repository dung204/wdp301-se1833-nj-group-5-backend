import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';

import { SwaggerExamples } from '@/base/constants/swagger-example.constants';
import { QueryDto, SchemaResponseDto } from '@/base/dtos';
import { HotelResponseDto } from '@/modules/hotels/dtos/hotel.dto';
import { CancelEnum } from '@/modules/hotels/enums';
import { RoomResponseDto } from '@/modules/rooms/dtos/room.dto';
import { PaymentMethodEnum } from '@/modules/transactions/schemas/transaction.schema';
import { UserProfileDto } from '@/modules/users/dtos/user.dtos';

import { BookingStatus } from '../enums/booking-status.enum';
import { Booking } from '../schemas/booking.schema';

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
  @Type(() => RoomResponseDto)
  room!: RoomResponseDto;

  @ApiProperty({
    description: 'Check-in date',
    example: SwaggerExamples.CHECK_IN_DATE,
  })
  @Expose()
  checkIn!: Date;

  @ApiProperty({
    description: 'Check-out date',
    example: SwaggerExamples.CHECK_OUT_DATE,
  })
  @Expose()
  checkOut!: Date;

  @ApiProperty({
    description: 'Booking status',
    example: BookingStatus.CONFIRMED,
    enum: BookingStatus,
  })
  @Expose()
  status!: BookingStatus;

  @ApiProperty({
    description: 'Total price of the booking',
    example: SwaggerExamples.TOTAL_PRICE,
  })
  @Expose()
  totalPrice!: number;

  @ApiProperty({
    description: 'Quantity of rooms booked',
    example: SwaggerExamples.BOOKING_QUANTITY,
  })
  @Expose()
  @Type(() => Number)
  @IsNumber({}, { message: 'quantity must be a number' })
  @Transform(({ value }) => parseFloat(value as string))
  quantity!: number;

  @ApiProperty({
    description: 'Minimum occupancy for the booking',
    example: SwaggerExamples.MIN_OCCUPANCY,
  })
  @Expose()
  @Type(() => Number)
  @IsNumber({}, { message: 'minOccupancy must be a number' })
  @Transform(({ value }) => parseFloat(value as string))
  minOccupancy!: number;

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
    example: SwaggerExamples.DATE_FROM,
    required: false,
  })
  @Expose()
  cancelledAt?: Date;

  @ApiProperty({
    description: 'Refund amount',
    example: SwaggerExamples.TOTAL_PRICE,
    required: false,
  })
  @Expose()
  refundAmount?: number;

  @ApiProperty({
    description: 'Payment Url',
    example: SwaggerExamples.PAYMENT_URL,
    type: String,
  })
  @Expose()
  paymentUrl!: string;

  @ApiProperty({
    description: 'Payment method used for the booking',
    type: String,
  })
  @Expose()
  paymentMethod!: string;
}

export class CreateBookingDto {
  @ApiProperty({
    description: 'Hotel ID',
    example: SwaggerExamples.HOTEL_ID,
  })
  @IsNotEmpty()
  @IsString()
  hotel!: string;

  @ApiProperty({
    description: 'Room ID',
    example: SwaggerExamples.ROOM_ID,
  })
  @IsNotEmpty()
  @IsString()
  room!: string;

  @ApiProperty({
    description: 'Check-in date',
    example: SwaggerExamples.CHECK_IN_DATE,
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @Transform(({ value }) => {
    const date = new Date(value as string);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      throw new BadRequestException('Check-in date must be today or in the future');
    }
    return date;
  })
  checkIn!: Date;

  @ApiProperty({
    description: 'Check-out date',
    example: SwaggerExamples.CHECK_OUT_DATE,
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @Transform(({ value }) => {
    const date = new Date(value as string);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      throw new BadRequestException('Check-in date must be today or in the future');
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

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethodEnum,
    example: PaymentMethodEnum.PAYMENT_GATEWAY,
  })
  @IsNotEmpty()
  @IsEnum(PaymentMethodEnum)
  @IsString()
  paymentMethod!: PaymentMethodEnum;

  @ApiProperty({
    description: 'Quantity of rooms booked',
    example: SwaggerExamples.BOOKING_QUANTITY,
  })
  @Expose()
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber({}, { message: 'quantity must be a number' })
  @Transform(({ value }) => parseFloat(value as string))
  quantity!: number;

  @ApiProperty({
    description: 'Minimum occupancy for the booking',
    example: SwaggerExamples.MIN_OCCUPANCY,
  })
  @Expose()
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber({}, { message: 'minOccupancy must be a number' })
  @Transform(({ value }) => parseFloat(value as string))
  minOccupancy!: number;
}

export class UpdateBookingDto {
  @ApiProperty({
    description: 'Check-in date',
    example: SwaggerExamples.CHECK_IN_DATE,
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  checkIn?: Date;

  @ApiProperty({
    description: 'Check-out date',
    example: SwaggerExamples.CHECK_OUT_DATE,
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  checkOut?: Date;

  @ApiProperty({
    description: 'Booking status',
    example: BookingStatus.CONFIRMED,
    enum: BookingStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiProperty({
    description: 'Total price of the booking',
    example: SwaggerExamples.TOTAL_PRICE,
    required: false,
  })
  @IsOptional()
  @IsDecimal()
  @Validate((value: string) => parseFloat(value) > 0)
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
  @IsDecimal()
  @Validate((value: string) => parseFloat(value) > 0)
  minPrice?: number;

  @ApiProperty({
    description: 'Filter by maximum total price',
    required: false,
  })
  @IsOptional()
  @IsDecimal()
  @Validate((value: string) => parseFloat(value) > 0)
  maxPrice?: number;

  @ApiProperty({
    description: 'Quantity of rooms booked',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'quantity must be a number' })
  @Transform(({ value }) => parseFloat(value as string))
  quantity?: number;

  @ApiProperty({
    description: 'Minimum occupancy for the booking',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'minOccupancy must be a number' })
  @Transform(({ value }) => parseFloat(value as string))
  minOccupancy?: number;

  @ApiProperty({
    description: 'Filter booking in the future: status ("all", true" | "false")',
    required: false,
    enum: ['all', 'true', 'false'],
  })
  @IsOptional()
  @IsString()
  inFuture?: string;
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

export class BookingByPaymentLinkDto extends Booking {
  @ApiProperty({
    description: 'Payment link to find the booking',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentLink!: string;
}
