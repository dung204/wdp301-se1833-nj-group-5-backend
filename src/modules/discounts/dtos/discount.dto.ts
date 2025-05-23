import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { SwaggerExamples } from '@/base/constants';
import { SchemaResponseDto } from '@/base/dtos';
import { DiscountState } from '@/modules/discounts/enums/discount.enum';

@Exclude()
export class DiscountResponseDto extends SchemaResponseDto {
  @ApiProperty({
    description: 'The discount amount ( default: percentage )',
    example: 10, // 10% discount,
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
    example: 1,
  })
  @Expose()
  maxQualityPerUser!: number;

  @ApiProperty({
    description: 'List of applicable hotels',
    example: ['hotelId1', 'hotelId2'],
  })
  @Expose()
  applicableHotels!: string[];

  @ApiProperty({
    description: 'Number of times this discount has been used',
    example: 0,
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
    example: 10,
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
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
  applicableHotels!: string[];

  @ApiProperty({
    description: 'Maximum number of times a user can use this discount',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
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
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
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
  applicableHotels?: string[];

  @ApiProperty({
    description: 'Maximum number of times a user can use this discount',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
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

export class DiscountQueryDto {
  @ApiProperty({
    description: 'Filter by minimum amount',
    required: false,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
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
    example: 'eb4ddc1f-e320-4fbb-8bfa-eed8b06d64aa',
  })
  @IsOptional()
  @IsString()
  hotelId?: string;
}
