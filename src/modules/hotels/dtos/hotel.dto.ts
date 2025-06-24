import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { SwaggerExamples } from '@/base/constants';
import { QueryDto, SchemaResponseDto } from '@/base/dtos';
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
    description: 'The address of the hotel',
    example: '123 Main Street, City, Country',
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
    example: ['https://example.com/hotel1.jpg', 'https://example.com/hotel2.jpg'],
    type: [String],
  })
  @Expose()
  avatar!: string[];

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
    description: 'The address of the hotel',
    example: '123 Main Street, City, Country',
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
    example: '150.000',
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => Number)
  @IsNumber()
  priceHotel!: number;

  @ApiProperty({
    description: 'Cancellation policy',
    example: CancelEnum.REFUND_BEFORE_1_DAY,
    enum: CancelEnum,
  })
  @IsNotEmpty()
  @IsEnum(CancelEnum) // Thay đổi từ @IsString() thành @IsEnum()
  cancelPolicy!: CancelEnum; // Thay đổi từ string thành CancelEnum

  @ApiProperty({
    description: 'Check-in time range',
    example: {
      from: '2023-01-01T14:00:00Z',
      to: '2023-01-01T22:00:00Z',
    },
    type: CheckinTimeRangeDto,
  })
  @ValidateNested() // thông báo cho hệ thống rằng thuộc tính này là một đối tượng lồng nhau
  // nó sẽ có type tương ứng với CheckinTimeRangeDto
  @Type(() => CheckinTimeRangeDto)
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
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
    example: ['https://example.com/hotel1.jpg', 'https://example.com/hotel2.jpg'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray() // kiểm tra xem thuộc tính này có phải là một mảng hay không
  @IsString({ each: true }) // từng phần tử trong mảng phải là một chuỗi
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  avatar?: string[];

  @ApiProperty({
    description: 'Services offered by the hotel',
    example: ['wifi', 'pool', 'parking', 'breakfast'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  services?: string[];

  @ApiProperty({
    description: 'Rating',
    example: '5',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
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
    description: 'The address of the hotel',
    example: '123 Main Street, City, Country',
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
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
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
    description: 'Hotel images',
    example: ['https://example.com/hotel1.jpg', 'https://example.com/hotel2.jpg'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  avatar?: string[];

  @ApiProperty({
    description: 'Services offered by the hotel',
    example: ['wifi', 'pool', 'parking', 'breakfast'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  services?: string[];

  @ApiProperty({
    description: 'Rating',
    example: '5',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rating?: number;

  @ApiProperty({
    description: 'Cancellation policy',
    example: CancelEnum.REFUND_BEFORE_1_DAY,
    enum: CancelEnum,
    required: false,
  })
  @IsOptional()
  @IsEnum(CancelEnum) // Thay đổi từ @IsString() thành @IsEnum()
  cancelPolicy?: CancelEnum; // Thay đổi từ string thành CancelEnum

  @ApiProperty({
    description: 'Average price per night for the hotel',
    example: 150000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceHotel?: number; // Sửa từ required thành optional
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
  @Type(() => Number)
  @IsNumber()
  minRating?: number;

  @ApiProperty({
    description: 'Filter hotels by services',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @ApiProperty({
    description: 'Filter by minimum price',
    required: false,
    example: 100000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number; // Đổi tên từ priceHotel thành minPrice

  @ApiProperty({
    description: 'Filter by maximum price',
    required: false,
    example: 500000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number; // Thêm maxPrice

  @ApiProperty({
    description: 'Filter by cancellation policy',
    example: CancelEnum.REFUND_BEFORE_1_DAY,
    enum: CancelEnum,
    required: false,
  })
  @IsOptional()
  @IsEnum(CancelEnum) // Thay đổi từ @IsString() thành @IsEnum()
  cancelPolicy?: CancelEnum; // Thay đổi từ string thành CancelEnum và thành optional
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
