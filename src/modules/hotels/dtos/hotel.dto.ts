import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { SwaggerExamples } from '@/base/constants';
import { SchemaResponseDto } from '@/base/dtos';
import { UserProfileDto } from '@/modules/users/dtos/user.dtos';

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
  services?: string[];

  @ApiProperty({
    description: 'Rating',
    example: '5',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rating!: number;

  @ApiProperty({
    description: 'Whether the hotel is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class HotelQueryDto {
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
