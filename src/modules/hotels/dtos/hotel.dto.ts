import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { SwaggerExamples } from '@/base/constants';
import { ImageDto, QueryDto, SchemaResponseDto } from '@/base/dtos';
import { transformToFloatNumber, transformToJSON, transformToStringArray } from '@/base/utils';
import { UserProfileDto } from '@/modules/users/dtos/user.dtos';

import { CancelEnum } from '../enums';

class CheckinTimeRangeDto {
  @ApiProperty({
    description: 'The start time for check-in',
    example: '2023-01-01T14:00:00Z',
  })
  @Type(() => Date)
  @IsDate()
  @Expose()
  from!: Date;

  @ApiProperty({
    description: 'The end time for check-in',
    example: '2023-01-01T22:00:00Z',
  })
  @Type(() => Date)
  @IsDate()
  @Expose()
  to!: Date;
}

@Exclude() // mặc định loại bỏ các thuộc tính không được đánh dấu @Expose
export class HotelResponseDto extends SchemaResponseDto {
  @ApiProperty({
    description: 'The name of the hotel',
    example: 'Grand Hotel',
  })
  @Expose() // được đánh dấu để được bao gồm trong phản hồi
  name!: string;

  @ApiProperty({
    description: 'Province name',
    example: 'Hà Nội',
  })
  @Expose()
  province!: string;

  @ApiProperty({
    description: 'Commune name',
    example: 'Phường Hoàn Kiếm',
  })
  @Expose()
  commune!: string;

  @ApiProperty({
    description: 'The detailed address of the hotel',
    example: '123 Main Street',
  })
  @Expose()
  address!: string;

  @ApiProperty({
    description: 'Description of the hotel',
    example: 'A luxurious hotel with amazing views',
  })
  @Expose()
  description!: string;

  @ApiProperty({
    description: 'The owner of the hotel',
    type: UserProfileDto,
  })
  @Expose()
  @Type(() => UserProfileDto)
  owner!: UserProfileDto;

  @ApiProperty({
    description: 'Phone number of the hotel',
    example: '+84123456789',
  })
  @Expose()
  phoneNumber!: string;

  @ApiProperty({
    description: 'Check-in time range',
    type: CheckinTimeRangeDto,
  })
  @Expose()
  checkinTime!: CheckinTimeRangeDto;

  @ApiProperty({
    description: 'Check-out time',
    example: '2023-01-01T12:00:00Z',
  })
  @Expose()
  checkoutTime!: Date;

  @ApiProperty({
    description: 'Hotel images',
    isArray: true,
    type: ImageDto,
  })
  @Expose()
  images!: ImageDto[];

  @ApiProperty({
    description: 'Rating of the hotel (0-5)',
    example: 4.5,
  })
  @Expose()
  rating!: number;

  @ApiProperty({
    description: 'Average price per night for the hotel',
    example: 150.0,
  })
  @Expose()
  priceHotel!: number;

  @ApiProperty({
    description: 'Cancellation policy in hours before check-in',
    example: CancelEnum.REFUND_BEFORE_1_DAY,
  })
  @Expose()
  cancelPolicy!: CancelEnum;

  @ApiProperty({
    description: 'Services offered by the hotel',
    example: ['wifi', 'pool', 'parking', 'breakfast'],
    type: [String],
  })
  @Expose()
  services!: string[];

  @ApiProperty({
    description: 'Whether the hotel is active',
    example: true,
  })
  @Expose()
  isActive!: boolean;
}

@Exclude()
export class DeletedHotelResponseDto extends HotelResponseDto {
  @ApiProperty({
    description: 'The timestamp when the hotel was deleted',
    example: SwaggerExamples.DATE_FROM,
  })
  @Expose()
  deleteTimestamp!: Date;
}

export class CreateHotelDto {
  @ApiProperty({
    description: 'The name of the hotel',
    example: 'Grand Hotel',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Province name',
    example: 'Hà Nội',
  })
  @IsNotEmpty()
  @IsString()
  province!: string;

  @ApiProperty({
    description: 'Commune name',
    example: 'Phường Hoàn Kiếm',
  })
  @IsNotEmpty()
  @IsString()
  commune!: string;

  @ApiProperty({
    description: 'The detailed address of the hotel',
    example: '123 Main Street',
  })
  @IsNotEmpty()
  @IsString()
  address!: string;

  @ApiProperty({
    description: 'Description of the hotel',
    example: 'A luxurious hotel with amazing views',
  })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({
    description: 'Phone number of the hotel',
    example: '+84123456789',
  })
  @IsNotEmpty()
  @IsString()
  phoneNumber!: string;

  @ApiProperty({
    description: 'Average price per night for the hotel',
    example: 150000,
  })
  @IsNotEmpty()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be positive' })
  priceHotel!: number;

  @ApiProperty({
    description: 'Cancellation policy',
    example: CancelEnum.REFUND_BEFORE_1_DAY,
    enum: CancelEnum,
  })
  @IsNotEmpty()
  @IsEnum(CancelEnum)
  cancelPolicy!: CancelEnum;

  @ApiProperty({
    description: 'Check-in time range',
    example: {
      from: '2023-01-01T14:00:00Z',
      to: '2023-01-01T22:00:00Z',
    },
    type: CheckinTimeRangeDto,
  })
  @ValidateNested()
  @Type(() => CheckinTimeRangeDto)
  @Transform(transformToJSON)
  checkinTime!: CheckinTimeRangeDto;

  @ApiProperty({
    description: 'Check-out time',
    example: '2023-01-01T12:00:00Z',
  })
  @Type(() => Date)
  @IsDate()
  checkoutTime!: Date;

  @ApiProperty({
    description: 'Hotel images',
    type: 'string',
    format: 'binary',
    isArray: true,
    required: false,
  })
  images?: string[];

  @ApiProperty({
    description: 'Services offered by the hotel',
    example: ['wifi', 'pool', 'parking', 'breakfast'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(transformToStringArray)
  services?: string[];

  @ApiProperty({
    description: 'Rating',
    example: 5,
  })
  @IsNotEmpty()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Rating must be a number' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  rating!: number;
}

export class UpdateHotelDto {
  @ApiProperty({
    description: 'The name of the hotel',
    example: 'Grand Hotel',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Province name',
    example: 'Hà Nội',
    required: false,
  })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({
    description: 'Commune name',
    example: 'Phường Hoàn Kiếm',
    required: false,
  })
  @IsOptional()
  @IsString()
  commune?: string;

  @ApiProperty({
    description: 'The detailed address of the hotel',
    example: '123 Main Street',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Description of the hotel',
    example: 'A luxurious hotel with amazing views',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Phone number of the hotel',
    example: '+84123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Check-in time range',
    example: {
      from: '2023-01-01T14:00:00Z',
      to: '2023-01-01T22:00:00Z',
    },
    type: CheckinTimeRangeDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CheckinTimeRangeDto)
  @Transform(transformToJSON)
  checkinTime?: CheckinTimeRangeDto;

  @ApiProperty({
    description: 'Check-out time',
    example: '2023-01-01T12:00:00Z',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  checkoutTime?: Date;

  @ApiProperty({
    description: 'New hotel images to upload',
    isArray: true,
    type: 'string',
    format: 'binary',
    required: false,
  })
  newImages: string[] = [];

  @ApiProperty({
    description: 'Hotel image file names to delete',
    isArray: true,
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  imagesToDelete: string[] = [];

  @ApiProperty({
    description: 'Services offered by the hotel',
    example: ['wifi', 'pool', 'parking', 'breakfast'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(transformToStringArray)
  services?: string[];

  @ApiProperty({
    description: 'Rating',
    example: 5,
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Rating must be a number' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  rating?: number;

  @ApiProperty({
    description: 'Cancellation policy',
    example: CancelEnum.REFUND_BEFORE_1_DAY,
    enum: CancelEnum,
    required: false,
  })
  @IsOptional()
  @IsEnum(CancelEnum)
  cancelPolicy?: CancelEnum;

  @ApiProperty({
    description: 'Average price per night for the hotel',
    example: 150000,
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be positive' })
  priceHotel?: number;
}

export class HotelQueryDto extends QueryDto {
  @ApiProperty({
    description: 'Filter hotels by id',
    required: false,
    example: 'eb4ddc1f-e320-4fbb-8bfa-eed8b06d64aa',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Filter hotels by name',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Filter hotels by address',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Filter hotels by minimum rating',
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Rating must be a number' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  minRating?: number;

  @ApiProperty({
    description: 'Filter hotels by services',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(transformToStringArray)
  services?: string[];

  @ApiProperty({
    description: 'Filter by minimum price',
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be positive' })
  minPrice?: number;

  @ApiProperty({
    description: 'Filter by maximum price',
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be positive' })
  maxPrice?: number;

  @ApiProperty({
    description: 'Filter by cancellation policy',
    example: CancelEnum.REFUND_BEFORE_1_DAY,
    enum: CancelEnum,
    required: false,
  })
  @IsOptional()
  @IsEnum(CancelEnum)
  cancelPolicy?: CancelEnum;

  @ApiProperty({
    description: 'Number of people to stay',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsInt()
  @Min(1)
  minOccupancy?: number;

  @ApiProperty({
    description: 'Check-in date',
    example: '2025-07-14T14:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  checkIn!: Date;

  @ApiProperty({
    description: 'Check-in date',
    example: '2025-07-15T14:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  checkOut!: Date;
}

export class HotelQueryDtoForAdmin extends HotelQueryDto {
  @ApiProperty({
    description: 'Filter hotels by owner ID',
    required: false,
    example: 'eb4ddc1f-e320-4fbb-8bfa-eed8b06d64aa',
  })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiProperty({
    description: 'Filter hotels by active status ("all" | "true" | "false")',
    required: false,
    example: 'true',
    enum: ['all', 'true', 'false'],
  })
  @IsOptional()
  @IsString()
  isActive?: string;
}

export class HotelsWithAvailabilityResponseDto extends HotelResponseDto {
  @ApiProperty({
    description: 'Room availability information',
    example: {
      totalRooms: 5,
      bookedRooms: 2,
      availableRooms: 3,
    },
    required: false,
  })
  @Expose()
  rooms?: {
    totalRooms: number;
    bookedRooms: number;
    availableRooms: number;
  };
}
