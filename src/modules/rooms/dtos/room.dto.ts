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

import { SwaggerExamples } from '@/base/constants';
import { ImageDto, QueryDto, SchemaResponseDto } from '@/base/dtos';
import { transformToDate, transformToFloatNumber, transformToStringArray } from '@/base/utils';
import { HotelResponseDto } from '@/modules/hotels/dtos/hotel.dto';

export class RoomAvailabilityDto {
  @ApiProperty({
    description: 'Total rooms of this type (same as maxQuantity)',
    example: SwaggerExamples.ROOM_TOTAL_AVAILABLE,
  })
  total!: number;

  @ApiProperty({
    description: 'Number of booked rooms',
    example: SwaggerExamples.ROOM_BOOKED,
    default: 0,
  })
  booked!: number;

  @ApiProperty({
    description: 'Number of available rooms (total - booked)',
    example: SwaggerExamples.ROOM_AVAILABLE,
  })
  available!: number;
}

@Exclude()
export class RoomResponseDto extends SchemaResponseDto {
  @ApiProperty({
    description: 'The name of the room',
    example: SwaggerExamples.ROOM_NAME,
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
    example: SwaggerExamples.ROOM_RATE,
  })
  @Expose()
  rate!: number;

  @ApiProperty({
    description: 'The size of the room in square meters',
    example: SwaggerExamples.ROOM_SIZE,
  })
  @Expose()
  size!: number;

  @ApiProperty({
    description: 'Maximum number of people that can stay in the room',
    example: SwaggerExamples.ROOM_OCCUPANCY,
  })
  @Expose()
  occupancy!: number;

  @ApiProperty({
    description: 'Services offered in the room',
    example: SwaggerExamples.ROOM_SERVICES,
    type: [String],
  })
  @Expose()
  services!: string[];

  @ApiProperty({
    description: 'Images of the room',
    isArray: true,
    type: ImageDto,
  })
  @Expose()
  images!: ImageDto[];

  @ApiProperty({
    description: 'Maximum quantity of this room type available',
    example: SwaggerExamples.ROOM_MAX_QUANTITY,
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
    example: SwaggerExamples.DATE_FROM,
  })
  @Expose()
  deleteTimestamp!: Date;
}

export class CreateRoomDto {
  @ApiProperty({
    description: 'The name of the room',
    example: SwaggerExamples.ROOM_NAME,
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'The ID of the hotel this room belongs to',
    example: SwaggerExamples.HOTEL_ID,
  })
  @IsNotEmpty()
  @IsString()
  hotel!: string;

  @ApiProperty({
    description: 'The rate (price) of the room per night',
    example: SwaggerExamples.ROOM_RATE,
  })
  @IsNotEmpty()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Rate must be a number' })
  @IsPositive({ message: 'Rate must be a positive number' })
  rate!: number;

  @ApiProperty({
    description: 'The size of the room in square meters',
    example: SwaggerExamples.ROOM_SIZE,
  })
  @IsNotEmpty()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Size must be a number' })
  @IsPositive({ message: 'Size must be a positive number' })
  size!: number;

  @ApiProperty({
    description: 'Maximum number of people that can stay in the room',
    example: SwaggerExamples.ROOM_OCCUPANCY,
  })
  @IsNotEmpty()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Occupancy must be a number' })
  @Min(1, { message: 'Occupancy must be at least 1' })
  occupancy!: number;

  @ApiProperty({
    description: 'Services offered in the room',
    example: SwaggerExamples.ROOM_SERVICES,
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(transformToStringArray)
  services?: string[];

  @ApiProperty({
    description: 'Room images',
    type: 'string',
    format: 'binary',
    isArray: true,
    required: false,
  })
  images?: string[];

  @ApiProperty({
    description: 'Maximum quantity of this room type available',
    example: SwaggerExamples.ROOM_MAX_QUANTITY,
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
    example: SwaggerExamples.ROOM_NAME,
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'The rate (price) of the room per night',
    example: SwaggerExamples.ROOM_RATE,
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Rate must be a number' })
  @IsPositive({ message: 'Rate must be a positive number' })
  rate?: number;

  @ApiProperty({
    description: 'The size of the room in square meters',
    example: SwaggerExamples.ROOM_SIZE,
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Size must be a number' })
  @IsPositive({ message: 'Size must be a positive number' })
  size?: number;

  @ApiProperty({
    description: 'Maximum number of people that can stay in the room',
    example: SwaggerExamples.ROOM_OCCUPANCY,
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Occupancy must be a number' })
  @Min(1, { message: 'Occupancy must be at least 1' })
  occupancy?: number;

  @ApiProperty({
    description: 'Services offered in the room',
    example: SwaggerExamples.ROOM_SERVICES,
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(transformToStringArray)
  services?: string[];

  @ApiProperty({
    description: 'New room images to upload',
    isArray: true,
    type: 'string',
    format: 'binary',
    required: false,
  })
  newImages: string[] = [];

  @ApiProperty({
    description: 'Room image file names to delete',
    isArray: true,
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  imagesToDelete: string[] = [];

  @ApiProperty({
    description: 'Maximum quantity of this room type available',
    example: SwaggerExamples.ROOM_MAX_QUANTITY,
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
    required: false,
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Filter rooms by hotel ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  hotel?: string;

  @ApiProperty({
    description: 'Filter rooms by check-in date (start date)',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @Transform(transformToDate)
  checkIn?: Date;

  @ApiProperty({
    description: 'Filter rooms by check-out date (end date)',
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
    enum: ['all', 'true', 'false'],
  })
  @IsOptional()
  @IsString()
  isActive?: string;
}
