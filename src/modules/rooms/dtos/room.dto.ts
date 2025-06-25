import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

import { QueryDto, SchemaResponseDto } from '@/base/dtos';
import { transformToDate, transformToFloatNumber, transformToStringArray } from '@/base/utils';
import { HotelResponseDto } from '@/modules/hotels/dtos/hotel.dto';

export class RoomAvailabilityDto {
  @ApiProperty({
    description: 'Total rooms of this type (same as maxQuantity)',
    example: 10,
  })
  total!: number;

  @ApiProperty({
    description: 'Number of booked rooms',
    example: 7,
    default: 0,
  })
  booked!: number;

  @ApiProperty({
    description: 'Number of available rooms (total - booked)',
    example: 3,
  })
  available!: number;
}

@Exclude()
export class RoomResponseDto extends SchemaResponseDto {
  @ApiProperty({
    description: 'The name of the room',
    example: 'Deluxe Ocean View Suite',
  })
  @Expose()
  name!: string;

  @ApiProperty({
    description: 'The hotel this room belongs to',
    type: HotelResponseDto,
  })
  @Expose()
  @Type(() => HotelResponseDto)
  hotel!: HotelResponseDto;

  @ApiProperty({
    description: 'The rate (price) of the room per night',
    example: 150,
  })
  @Expose()
  rate!: number;

  @ApiProperty({
    description: 'The size of the room in square meters',
    example: 35,
  })
  @Expose()
  size!: number;

  @ApiProperty({
    description: 'Maximum number of people that can stay in the room',
    example: 2,
  })
  @Expose()
  occupancy!: number;

  @ApiProperty({
    description: 'Services offered in the room',
    example: ['free wifi', 'minibar', 'air conditioning', 'TV'],
    type: [String],
  })
  @Expose()
  services!: string[];

  @ApiProperty({
    description: 'Images of the room',
    example: ['https://example.com/room1.jpg', 'https://example.com/room2.jpg'],
    type: [String],
  })
  @Expose()
  images!: string[];

  @ApiProperty({
    description: 'Maximum quantity of this room type available',
    example: 5,
  })
  @Expose()
  maxQuantity!: number;

  @ApiProperty({
    description: 'Whether the room is active',
    example: true,
  })
  @Expose()
  isActive!: boolean;

  // properties flex
  @ApiProperty({
    description: 'Room availability information',
    type: RoomAvailabilityDto,
  })
  @Expose()
  @Type(() => RoomAvailabilityDto)
  @Transform(({ obj }) => {
    return {
      total: obj.maxQuantity || 0,
      booked: obj?.availability?.booked || 0,
      available: (obj.maxQuantity || 0) - (obj?.availability?.booked || 0),
    };
  })
  availability!: RoomAvailabilityDto;

  @ApiProperty({
    description: 'Whether the room is sold out',
    example: false,
    default: false,
  })
  @Expose()
  @Transform(({ obj }) => {
    const total = obj.maxQuantity || 0;
    const booked = obj?.availability?.booked || 0;
    return booked >= total;
  })
  isSoldOut!: boolean;
}

@Exclude()
export class DeletedRoomResponseDto extends RoomResponseDto {
  @ApiProperty({
    description: 'The timestamp when the room was deleted',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  deleteTimestamp!: Date;
}

export class CreateRoomDto {
  @ApiProperty({
    description: 'The name of the room',
    example: 'Deluxe Ocean View Suite',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'The ID of the hotel this room belongs to',
    example: 'eb4ddc1f-e320-4fbb-8bfa-eed8b06d64aa',
  })
  @IsNotEmpty()
  @IsString()
  hotel!: string;

  @ApiProperty({
    description: 'The rate (price) of the room per night',
    example: 150,
  })
  @IsNotEmpty()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Rate must be a number' })
  @IsPositive({ message: 'Rate must be a positive number' })
  rate!: number;

  @ApiProperty({
    description: 'The size of the room in square meters',
    example: 35,
  })
  @IsNotEmpty()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Size must be a number' })
  @IsPositive({ message: 'Size must be a positive number' })
  size!: number;

  @ApiProperty({
    description: 'Maximum number of people that can stay in the room',
    example: 2,
  })
  @IsNotEmpty()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Occupancy must be a number' })
  @Min(1, { message: 'Occupancy must be at least 1' })
  occupancy!: number;

  @ApiProperty({
    description: 'Services offered in the room',
    example: ['free wifi', 'minibar', 'air conditioning', 'TV'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(transformToStringArray)
  services?: string[];

  @ApiProperty({
    description: 'Images of the room',
    example: ['https://example.com/room1.jpg', 'https://example.com/room2.jpg'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(transformToStringArray)
  images?: string[];

  @ApiProperty({
    description: 'Maximum quantity of this room type available',
    example: 5,
  })
  @IsNotEmpty()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Max quantity must be a number' })
  @Min(1, { message: 'Max quantity must be at least 1' })
  maxQuantity!: number;
}

export class UpdateRoomDto {
  @ApiProperty({
    description: 'The name of the room',
    example: 'Deluxe Ocean View Suite',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'The rate (price) of the room per night',
    example: 150,
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Rate must be a number' })
  @IsPositive({ message: 'Rate must be a positive number' })
  rate?: number;

  @ApiProperty({
    description: 'The size of the room in square meters',
    example: 35,
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Size must be a number' })
  @IsPositive({ message: 'Size must be a positive number' })
  size?: number;

  @ApiProperty({
    description: 'Maximum number of people that can stay in the room',
    example: 2,
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Occupancy must be a number' })
  @Min(1, { message: 'Occupancy must be at least 1' })
  occupancy?: number;

  @ApiProperty({
    description: 'Services offered in the room',
    example: ['free wifi', 'minibar', 'air conditioning', 'TV'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(transformToStringArray)
  services?: string[];

  @ApiProperty({
    description: 'Images of the room',
    example: ['https://example.com/room1.jpg', 'https://example.com/room2.jpg'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(transformToStringArray)
  images?: string[];

  @ApiProperty({
    description: 'Maximum quantity of this room type available',
    example: 5,
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Max quantity must be a number' })
  @Min(1, { message: 'Max quantity must be at least 1' })
  maxQuantity?: number;
}

export class RoomQueryDto extends QueryDto {
  @ApiProperty({
    description: 'Filter rooms by room ID',
    example: '0516a80a-2c32-4606-b606-7e5af878079f',
    required: false,
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Filter rooms by hotel ID',
    example: '60d21b4667d0d8992e610c85',
    required: false,
  })
  @IsOptional()
  @IsString()
  hotel?: string;

  @ApiProperty({
    description: 'Filter rooms by check-in date (start date)',
    example: '2025-06-23T14:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @Transform(transformToDate)
  checkIn?: Date;

  @ApiProperty({
    description: 'Filter rooms by check-out date (end date)',
    example: '2025-06-24T12:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @Transform(transformToDate)
  checkOut?: Date;

  @ApiProperty({
    description: 'Filter rooms by name',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Filter rooms by minimum rate',
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Min rate must be a number' })
  minRate?: number;

  @ApiProperty({
    description: 'Filter rooms by maximum rate',
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Max rate must be a number' })
  maxRate?: number;

  @ApiProperty({
    description: 'Filter rooms by minimum occupancy',
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Min occupancy must be a number' })
  minOccupancy?: number;

  @ApiProperty({
    description: 'Filter rooms by services offered',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(transformToStringArray)
  services?: string[];
}

export class RoomQueryAdminDto extends RoomQueryDto {
  @ApiProperty({
    description: 'Filter rooms by active status',
    required: false,
    example: 'true',
    enum: ['all', 'true', 'false'],
  })
  @IsOptional()
  @IsString()
  isActive?: string;
}
