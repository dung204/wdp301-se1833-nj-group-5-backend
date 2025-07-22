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
    example: '2024-01-15T00:00:00.000Z',
  })
  @Expose()
  date!: Date;

  @ApiProperty({
    description: 'Total revenue for the day',
    example: 2500000,
  })
  @Expose()
  totalRevenue!: number;

  @ApiProperty({
    description: 'Total number of bookings for the day',
    example: 8,
  })
  @Expose()
  totalBookings!: number;
}

export class CreateDailyRevenueReportDto {
  @ApiProperty({
    description: 'Hotel ID',
    example: '84d67269-7470-4ef1-bfbb-c66e7cf8c955',
  })
  @IsNotEmpty()
  @IsString()
  hotel!: string;

  @ApiProperty({
    description: 'Date of the revenue report',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  date!: Date;

  @ApiProperty({
    description: 'Total revenue for the day',
    example: 2500000,
  })
  @IsNotEmpty()
  @Transform(transformToFloatNumber) // 1. Transform đứng trước
  @IsNumber({}, { message: 'Total revenue must be a number' }) // 2. IsNumber đứng sau
  @IsPositive({ message: 'Total revenue must be positive' })
  totalRevenue!: number;

  @ApiProperty({
    description: 'Total number of bookings for the day',
    example: 8,
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
    example: '2024-01-15T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;

  @ApiProperty({
    description: 'Total revenue for the day',
    example: 2500000,
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber) // 1. Transform đứng trước
  @IsNumber({}, { message: 'Total revenue must be a number' }) // 2. IsNumber đứng sau
  @IsPositive({ message: 'Total revenue must be positive' })
  totalRevenue?: number;

  @ApiProperty({
    description: 'Total number of bookings for the day',
    example: 8,
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
    example: 2025,
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
    example: '84d67269-7470-4ef1-bfbb-c66e7cf8c955',
  })
  hotelId!: string;

  @ApiProperty({
    description: 'Year',
    example: 2024,
  })
  year!: number;

  @ApiProperty({
    description: 'Total revenue for the year',
    example: 50000000,
  })
  totalRevenue!: number;

  @ApiProperty({
    description: 'Total bookings for the year',
    example: 150,
  })
  totalBookings!: number;
}

export class MonthlyRevenueResponseDto extends SchemaResponseDto {
  @ApiProperty({
    description: 'Hotel ID',
    example: '84d67269-7470-4ef1-bfbb-c66e7cf8c955',
  })
  hotelId!: string;

  @ApiProperty({
    description: 'Month (1-12)',
    example: 6,
  })
  month!: number;

  @ApiProperty({
    description: 'Total revenue for the month',
    example: 5000000,
  })
  totalRevenue!: number;

  @ApiProperty({
    description: 'Total bookings for the month',
    example: 15,
  })
  totalBookings!: number;
}
