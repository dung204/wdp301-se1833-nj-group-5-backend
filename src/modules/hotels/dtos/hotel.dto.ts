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
    example: SwaggerExamples.HOTEL_CHECKIN_TIME.from,
  })
  @Type(() => Date)
  @IsDate()
  @Expose()
  from!: Date;

  @ApiProperty({
    description: 'The end time for check-in',
    example: SwaggerExamples.HOTEL_CHECKIN_TIME.to,
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
    example: SwaggerExamples.HOTEL_NAME,
  })
  @Expose() // được đánh dấu để được bao gồm trong phản hồi
  name!: string;

  @ApiProperty({
    description: 'Province name',
    example: SwaggerExamples.HOTEL_PROVINCE,
  })
  @Expose()
  province!: string;

  @ApiProperty({
    description: 'Commune name',
    example: SwaggerExamples.HOTEL_COMMUNE,
  })
  @Expose()
  commune!: string;

  @ApiProperty({
    description: 'The detailed address of the hotel',
    example: SwaggerExamples.HOTEL_ADDRESS,
  })
  @Expose()
  address!: string;

  @ApiProperty({
    description: 'Description of the hotel',
    example: SwaggerExamples.HOTEL_DESCRIPTION,
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
    example: SwaggerExamples.HOTEL_PHONE,
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
    example: SwaggerExamples.HOTEL_CHECKOUT_TIME,
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
    example: SwaggerExamples.HOTEL_RATING,
  })
  @Expose()
  rating!: number;

  @ApiProperty({
    description: 'Average price per night for the hotel',
    example: SwaggerExamples.HOTEL_PRICE,
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
    example: SwaggerExamples.HOTEL_SERVICES,
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
    example: SwaggerExamples.HOTEL_NAME,
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Province name',
    example: SwaggerExamples.HOTEL_PROVINCE,
  })
  @IsNotEmpty()
  @IsString()
  province!: string;

  @ApiProperty({
    description: 'Commune name',
    example: SwaggerExamples.HOTEL_COMMUNE,
  })
  @IsNotEmpty()
  @IsString()
  commune!: string;

  @ApiProperty({
    description: 'The detailed address of the hotel',
    example: SwaggerExamples.HOTEL_ADDRESS,
  })
  @IsNotEmpty()
  @IsString()
  address!: string;

  @ApiProperty({
    description: 'Description of the hotel',
    example: SwaggerExamples.HOTEL_DESCRIPTION,
  })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({
    description: 'Phone number of the hotel',
    example: SwaggerExamples.HOTEL_PHONE,
  })
  @IsNotEmpty()
  @IsString()
  phoneNumber!: string;

  @ApiProperty({
    description: 'Average price per night for the hotel',
    example: SwaggerExamples.HOTEL_PRICE,
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
    example: SwaggerExamples.HOTEL_CHECKIN_TIME,
    type: CheckinTimeRangeDto,
  })
  @ValidateNested()
  @Type(() => CheckinTimeRangeDto)
  @Transform(transformToJSON)
  checkinTime!: CheckinTimeRangeDto;

  @ApiProperty({
    description: 'Check-out time',
    example: SwaggerExamples.HOTEL_CHECKOUT_TIME,
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
    example: SwaggerExamples.HOTEL_SERVICES,
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
    example: SwaggerExamples.HOTEL_RATING,
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
    example: SwaggerExamples.HOTEL_NAME,
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Province name',
    example: SwaggerExamples.HOTEL_PROVINCE,
    required: false,
  })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({
    description: 'Commune name',
    example: SwaggerExamples.HOTEL_COMMUNE,
    required: false,
  })
  @IsOptional()
  @IsString()
  commune?: string;

  @ApiProperty({
    description: 'The detailed address of the hotel',
    example: SwaggerExamples.HOTEL_ADDRESS,
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Description of the hotel',
    example: SwaggerExamples.HOTEL_DESCRIPTION,
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Phone number of the hotel',
    example: SwaggerExamples.HOTEL_PHONE,
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Check-in time range',
    example: SwaggerExamples.HOTEL_CHECKIN_TIME,
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
    example: SwaggerExamples.HOTEL_CHECKOUT_TIME,
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
    example: SwaggerExamples.HOTEL_SERVICES,
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
    example: SwaggerExamples.HOTEL_RATING,
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
    example: SwaggerExamples.HOTEL_PRICE,
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
    enum: CancelEnum,
    required: false,
  })
  @IsOptional()
  @IsEnum(CancelEnum)
  cancelPolicy?: CancelEnum;

  @ApiProperty({
    description: 'Number of people to stay',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string))
  @IsInt()
  @Min(1)
  minOccupancy?: number;

  @ApiProperty({
    description: 'Check-in date',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  checkIn!: Date;

  @ApiProperty({
    description: 'Check-out date',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  checkOut!: Date;

  @ApiProperty({
    description: 'Filter hotels by name or address, it will have new name is searchTerm',
    required: false,
  })
  @IsOptional()
  @IsString()
  searchTerm?: string;
}

export class HotelQueryDtoForAdmin extends HotelQueryDto {
  @ApiProperty({
    description: 'Filter hotels by owner ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiProperty({
    description: 'Filter hotels by active status ("all" | "true" | "false")',
    required: false,
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

@Exclude()
export class DeletedHotelsWithAvailabilityResponseDto extends HotelsWithAvailabilityResponseDto {
  @ApiProperty({
    description: 'The timestamp when the hotel was deleted',
    example: SwaggerExamples.DATE_FROM,
  })
  @Expose()
  deleteTimestamp!: Date;
}
