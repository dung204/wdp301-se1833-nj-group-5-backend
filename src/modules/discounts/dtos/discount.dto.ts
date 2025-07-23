import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

import { SwaggerExamples } from '@/base/constants';
import { QueryDto, SchemaResponseDto } from '@/base/dtos';
import { transformToFloatNumber, transformToStringArray } from '@/base/utils/transform.utils';
import { DiscountState } from '@/modules/discounts/enums/discount.enum';
import { HotelResponseDto } from '@/modules/hotels/dtos/hotel.dto';

@Exclude()
export class DiscountResponseDto extends SchemaResponseDto {
  @ApiProperty({
    description: 'The discount amount ( default: percentage )',
    example: SwaggerExamples.DISCOUNT_AMOUNT, // 10% discount,
  })
  @Expose()
  amount!: number;

  @ApiProperty({
    description: 'The expiration timestamp of the discount',
    example: SwaggerExamples.DATE_FROM,
  })
  @Expose()
  expiredTimestamp!: Date;

  @ApiProperty({
    description: 'Maximum number of times a user can use this discount',
    example: SwaggerExamples.DISCOUNT_MAX_QUALITY_PER_USER,
  })
  @Expose()
  maxQualityPerUser!: number;

  @ApiProperty({
    description: 'List of applicable hotels',
    type: HotelResponseDto,
    isArray: true,
  })
  @Expose()
  @Transform(({ value }) => {
    return Array.isArray(value) ? value : [];
  })
  @Type(() => HotelResponseDto)
  applicableHotels!: HotelResponseDto[];

  @ApiProperty({
    description: 'Number of times this discount has been used',
    example: SwaggerExamples.DISCOUNT_USAGE_COUNT,
  })
  @Expose()
  usageCount!: number;

  @ApiProperty({
    description: 'Current state of the discount',
    enum: DiscountState,
    enumName: 'DiscountState',
    example: DiscountState.ACTIVE,
  })
  @Expose()
  state!: string;
}

@Exclude()
export class DeletedDiscountResponseDto extends DiscountResponseDto {
  @ApiProperty({
    description: 'The timestamp when the discount was deleted',
    example: SwaggerExamples.DATE_FROM,
  })
  @Expose()
  deleteTimestamp!: Date;
}

export class CreateDiscountDto {
  @ApiProperty({
    description: 'The discount amount',
    example: SwaggerExamples.DISCOUNT_AMOUNT,
  })
  @IsNotEmpty()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Amount must be a number' })
  @IsPositive({ message: 'Amount must be a positive number' })
  amount!: number;

  @ApiProperty({
    description: 'The expiration timestamp of the discount',
    example: SwaggerExamples.DATE_FROM,
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  expiredTimestamp!: Date;

  @ApiProperty({
    description: 'The list of applicable hotels',
    example: SwaggerExamples.ACCEPT_HOTEL,
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  @Transform(transformToStringArray)
  applicableHotels!: string[];

  @ApiProperty({
    description: 'Maximum number of times a user can use this discount',
    example: SwaggerExamples.DISCOUNT_MAX_QUALITY_PER_USER,
  })
  @IsNotEmpty()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Max quality per user must be a number' })
  @Min(1, { message: 'Max quality per user must be at least 1' })
  maxQualityPerUser!: number;

  @ApiProperty({
    description: 'Current state of the discount',
    enum: DiscountState,
    enumName: 'DiscountState',
    example: DiscountState.ACTIVE,
  })
  @IsNotEmpty()
  @IsEnum(DiscountState)
  state!: string;
}

export class UpdateDiscountDto {
  @ApiProperty({
    description: 'The discount amount',
    example: SwaggerExamples.DISCOUNT_AMOUNT,
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Amount must be a number' })
  @IsPositive({ message: 'Amount must be a positive number' })
  amount?: number;

  @ApiProperty({
    description: 'The expiration timestamp of the discount',
    example: SwaggerExamples.DATE_FROM,
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiredTimestamp?: Date;

  @ApiProperty({
    description: 'The list of applicable hotels',
    example: SwaggerExamples.ACCEPT_HOTEL,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(transformToStringArray)
  applicableHotels?: string[];

  @ApiProperty({
    description: 'Maximum number of times a user can use this discount',
    example: SwaggerExamples.DISCOUNT_MAX_QUALITY_PER_USER,
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Max quality per user must be a number' })
  @Min(1, { message: 'Max quality per user must be at least 1' })
  maxQualityPerUser?: number;

  @ApiProperty({
    description: 'Current state of the discount',
    enum: DiscountState,
    enumName: 'DiscountState',
    example: DiscountState.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(DiscountState)
  state?: string;
}

export class DiscountQueryDto extends QueryDto {
  @ApiProperty({
    description: 'Filter by discount ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Filter by minimum amount',
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber)
  @IsNumber({}, { message: 'Min amount must be a number' })
  @IsPositive({ message: 'Min amount must be a positive number' })
  minAmount?: number;

  @ApiProperty({
    description: 'Filter by state',
    enum: DiscountState,
    enumName: 'DiscountState',
    required: false,
  })
  @IsOptional()
  @IsEnum(DiscountState)
  state?: DiscountState;

  @ApiProperty({
    description: 'Filter by hotel ID',
    required: false,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(transformToStringArray)
  hotelId?: string[];
}
