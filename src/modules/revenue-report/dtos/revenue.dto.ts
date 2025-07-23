import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

import { SwaggerExamples } from '@/base/constants';
import { SchemaResponseDto } from '@/base/dtos';
import { transformToFloatNumber } from '@/base/utils/transform.utils';
import { HotelResponseDto } from '@/modules/hotels/dtos/hotel.dto';

@Exclude()
export class DailyRevenueReportResponseDto extends SchemaResponseDto {
  @ApiProperty({
    description: 'The hotel for the revenue report',
    type: HotelResponseDto,
  })
  @Expose()
  @Type(() => HotelResponseDto)
  hotel!: HotelResponseDto;

  @ApiProperty({
    description: 'Date of the revenue report',
    example: SwaggerExamples.REVENUE_DATE,
  })
  @Expose()
  date!: Date;

  @ApiProperty({
    description: 'Total revenue for the day',
    example: SwaggerExamples.TOTAL_REVENUE,
  })
  @Expose()
  totalRevenue!: number;

  @ApiProperty({
    description: 'Total number of bookings for the day',
    example: SwaggerExamples.TOTAL_BOOKINGS,
  })
  @Expose()
  totalBookings!: number;
}

export class CreateDailyRevenueReportDto {
  @ApiProperty({
    description: 'Hotel ID',
    example: SwaggerExamples.HOTEL_ID,
  })
  @IsNotEmpty()
  @IsString()
  hotel!: string;

  @ApiProperty({
    description: 'Date of the revenue report',
    example: SwaggerExamples.REVENUE_DATE,
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  date!: Date;

  @ApiProperty({
    description: 'Total revenue for the day',
    example: SwaggerExamples.TOTAL_REVENUE,
  })
  @IsNotEmpty()
  @Transform(transformToFloatNumber) // 1. Transform đứng trước
  @IsNumber({}, { message: 'Total revenue must be a number' }) // 2. IsNumber đứng sau
  @IsPositive({ message: 'Total revenue must be positive' })
  totalRevenue!: number;

  @ApiProperty({
    description: 'Total number of bookings for the day',
    example: SwaggerExamples.TOTAL_BOOKINGS,
  })
  @IsNotEmpty()
  @Transform(transformToFloatNumber) // 1. Transform đứng trước
  @IsNumber({}, { message: 'Total bookings must be a number' }) // 2. IsNumber đứng sau
  @IsPositive({ message: 'Total bookings must be positive' })
  totalBookings!: number;
}

export class UpdateDailyRevenueReportDto {
  @ApiProperty({
    description: 'Date of the revenue report',
    example: SwaggerExamples.REVENUE_DATE,
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;

  @ApiProperty({
    description: 'Total revenue for the day',
    example: SwaggerExamples.TOTAL_REVENUE,
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber) // 1. Transform đứng trước
  @IsNumber({}, { message: 'Total revenue must be a number' }) // 2. IsNumber đứng sau
  @IsPositive({ message: 'Total revenue must be positive' })
  totalRevenue?: number;

  @ApiProperty({
    description: 'Total number of bookings for the day',
    example: SwaggerExamples.TOTAL_BOOKINGS,
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber) // 1. Transform đứng trước
  @IsNumber({}, { message: 'Total bookings must be a number' }) // 2. IsNumber đứng sau
  @IsPositive({ message: 'Total bookings must be positive' })
  totalBookings?: number;
}

export class RevenueQueryDto {
  @ApiProperty({
    description: 'Filter by hotel ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  hotelId?: string;

  @ApiProperty({
    description: 'Filter by date (from)',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFrom?: Date;

  @ApiProperty({
    description: 'Filter by date (to)',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateTo?: Date;

  @ApiProperty({
    description: 'Filter by minimum revenue',
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber) // 1. Transform đứng trước
  @IsNumber({}, { message: 'Min revenue must be a number' }) // 2. IsNumber đứng sau
  @IsPositive({ message: 'Min revenue must be positive' })
  minRevenue?: number;

  @ApiProperty({
    description: 'Filter by maximum revenue',
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber) // 1. Transform đứng trước
  @IsNumber({}, { message: 'Max revenue must be a number' }) // 2. IsNumber đứng sau
  @IsPositive({ message: 'Max revenue must be positive' })
  maxRevenue?: number;

  @ApiProperty({
    description: 'Filter by minimum bookings count',
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber) // 1. Transform đứng trước
  @IsNumber({}, { message: 'Min bookings must be a number' }) // 2. IsNumber đứng sau
  @IsPositive({ message: 'Min bookings must be positive' })
  minBookings?: number;

  @ApiProperty({
    description: 'Filter by maximum bookings count',
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber) // 1. Transform đứng trước
  @IsNumber({}, { message: 'Max bookings must be a number' }) // 2. IsNumber đứng sau
  @IsPositive({ message: 'Max bookings must be positive' })
  maxBookings?: number;

  @ApiProperty({
    description: 'Filter by hotel owner ID (admin only)',
    required: false,
  })
  @IsOptional()
  @IsString()
  hotelOwnerId?: string;
}

export class MonthlyRevenueQueryDto {
  @ApiProperty({
    description: 'Year to get monthly revenue for',
    example: SwaggerExamples.YEAR,
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber) // 1. Transform đứng trước
  @IsNumber({}, { message: 'Year must be a number' }) // 2. IsNumber đứng sau
  @Min(2000, { message: 'Year must be at least 2000' })
  year!: number;

  @ApiProperty({
    description: 'Filter by hotel ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  hotelId?: string;
}

export class YearlyRevenueQueryDto extends MonthlyRevenueQueryDto {
  @ApiProperty({
    description: 'Filter by month (1-12)',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Month must be a number' })
  @Type(() => Number)
  @Transform(({ value }: { value: any }) => {
    const month = parseFloat(value as string);
    return !isNaN(month) && month >= 1 && month <= 12 ? month : undefined;
  })
  month?: number;
}

export class YearlyRevenueResponseDto extends SchemaResponseDto {
  @ApiProperty({
    description: 'Hotel ID',
    example: SwaggerExamples.HOTEL_ID,
  })
  hotelId!: string;

  @ApiProperty({
    description: 'Year',
    example: SwaggerExamples.YEAR,
  })
  year!: number;

  @ApiProperty({
    description: 'Total revenue for the year',
    example: SwaggerExamples.YEARLY_REVENUE,
  })
  totalRevenue!: number;

  @ApiProperty({
    description: 'Total bookings for the year',
    example: SwaggerExamples.YEARLY_BOOKINGS,
  })
  totalBookings!: number;
}

export class MonthlyRevenueResponseDto extends SchemaResponseDto {
  @ApiProperty({
    description: 'Hotel ID',
    example: SwaggerExamples.HOTEL_ID,
  })
  hotelId!: string;

  @ApiProperty({
    description: 'Month (1-12)',
    example: SwaggerExamples.MONTH,
  })
  month!: number;

  @ApiProperty({
    description: 'Total revenue for the month',
    example: SwaggerExamples.MONTHLY_REVENUE,
  })
  totalRevenue!: number;

  @ApiProperty({
    description: 'Total bookings for the month',
    example: SwaggerExamples.MONTHLY_BOOKINGS,
  })
  totalBookings!: number;
}
