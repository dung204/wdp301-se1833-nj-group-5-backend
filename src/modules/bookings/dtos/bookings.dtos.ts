import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsUUID, Min } from 'class-validator';

import { SwaggerExamples } from '@/base/constants';
import { OrderParams } from '@/base/decorators';
import { QueryDto } from '@/base/dtos';

import { BookingStatus } from '../enums/booking-status.enum';

export class BookingsSearchDto extends QueryDto {
  @OrderParams(['checkIn', 'checkOut', 'createTimestamp'])
  order: string[] = [];

  @ApiProperty({
    description: 'The booking ID to search for',
    example: SwaggerExamples.UUID,
    format: 'uuid',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'The user ID who created bookings to search for',
    example: SwaggerExamples.UUID,
    format: 'uuid',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  user?: string;

  @ApiProperty({
    description: 'The hotel ID in the bookings to search for',
    example: SwaggerExamples.UUID,
    format: 'uuid',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  hotel?: string;

  @ApiProperty({
    description: 'The room ID in the bookings to search for',
    example: SwaggerExamples.UUID,
    format: 'uuid',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  room?: string;

  @ApiProperty({
    description: 'The bookings with check-in date greater or equal to this date will be returned',
    example: SwaggerExamples.DATE_FROM,
    format: 'datetime',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  fromCheckIn?: string;

  @ApiProperty({
    description: 'The bookings with check-in date smaller or equal to this date will be returned',
    example: SwaggerExamples.DATE_TO,
    format: 'datetime',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  toCheckIn?: string;

  @ApiProperty({
    description: 'The bookings with check-out date greater or equal to this date will be returned',
    example: SwaggerExamples.DATE_TO,
    format: 'datetime',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  fromCheckOut?: string;

  @ApiProperty({
    description: 'The bookings with check-out date smaller or equal to this date will be returned',
    example: SwaggerExamples.DATE_TO,
    format: 'datetime',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  toCheckOut?: string;

  @ApiProperty({
    description: 'The statuses in the the bookings to search for',
    type: String,
    isArray: true,
    enum: BookingStatus,
    enumName: 'BookingStatus',
    required: false,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsEnum(BookingStatus, { each: true })
  status: BookingStatus[] = [];

  @ApiProperty({
    description: 'The bookings with total price greater or equal to this number will be returned',
    example: SwaggerExamples.PRICE_FROM,
    required: false,
  })
  @Transform(({ value }) => parseFloat(value as string))
  @Min(0)
  fromTotalPrice?: number;

  @ApiProperty({
    description: 'The bookings with total price smaller or equal to this number will be returned',
    example: SwaggerExamples.PRICE_TO,
    required: false,
  })
  @Transform(({ value }) => parseFloat(value as string))
  @Min(0)
  toTotalPrice?: number;
}

export class CreateBookingDto {
  @ApiProperty({
    description: 'The room to book',
    example: SwaggerExamples.UUID,
    format: 'uuid',
  })
  @IsUUID('4')
  room!: string;

  @ApiProperty({
    description: 'The date to check in the hotel',
    format: 'datetime',
    example: SwaggerExamples.DATE_FROM,
  })
  @IsDateString({ strict: true })
  checkIn!: string;

  @ApiProperty({
    description: 'The date to check out the hotel',
    format: 'datetime',
    example: SwaggerExamples.DATE_TO,
  })
  @IsDateString({ strict: true })
  checkOut!: string;

  @ApiProperty({
    description: 'The list of discounts to apply for this booking',
    isArray: true,
    type: String,
    format: 'uuid',
    required: false,
  })
  @IsUUID('4', { each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  discount: string[] = [];
}

export class UpdateBookingDto extends PartialType(CreateBookingDto) {}
