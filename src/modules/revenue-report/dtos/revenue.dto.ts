import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

import { SchemaResponseDto } from '@/base/dtos';
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
  @Type(() => Number)
  @IsNumber()
  totalRevenue!: number;

  @ApiProperty({
    description: 'Total number of bookings for the day',
    example: 8,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
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
  @Type(() => Number)
  @IsNumber()
  totalRevenue?: number;

  @ApiProperty({
    description: 'Total number of bookings for the day',
    example: 8,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
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
  @Type(() => Number)
  @IsNumber()
  minRevenue?: number;

  @ApiProperty({
    description: 'Filter by maximum revenue',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxRevenue?: number;

  @ApiProperty({
    description: 'Filter by minimum bookings count',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minBookings?: number;

  @ApiProperty({
    description: 'Filter by maximum bookings count',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxBookings?: number;

  @ApiProperty({
    description: 'Filter by hotel owner ID (admin only)',
    required: false,
  })
  @IsOptional()
  @IsString()
  hotelOwnerId?: string;
}

export class YearlyRevenueQueryDto {
  @ApiProperty({
    description: 'Filter by hotel ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  hotelId?: string;
}

export class MonthlyRevenueQueryDto {
  @ApiProperty({
    description: 'Year to get monthly revenue for',
    example: 2025,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  year!: number;

  @ApiProperty({
    description: 'Filter by hotel ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  hotelId?: string;
}

export class YearlyRevenueResponseDto {
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

export class MonthlyRevenueResponseDto {
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
