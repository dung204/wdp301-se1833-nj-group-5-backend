import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

import { SchemaResponseDto } from '@/base/dtos';
import { HotelResponseDto } from '@/modules/hotels/dtos/hotel.dto';

@Exclude()
export class RoomResponseDto extends SchemaResponseDto {
  @ApiProperty({
    description: 'The name of the room',
    example: 'Deluxe Ocean View Suite',
  })
  @Expose()
  name!: string;

  @ApiProperty({
    description: 'The hotel this room belongs to',
    type: HotelResponseDto,
  })
  @Expose()
  hotel!: HotelResponseDto;

  @ApiProperty({
    description: 'The rate (price) of the room per night',
    example: 150,
  })
  @Expose()
  rate!: number;

  @ApiProperty({
    description: 'The size of the room in square meters',
    example: 35,
  })
  @Expose()
  size!: number;

  @ApiProperty({
    description: 'Maximum number of people that can stay in the room',
    example: 2,
  })
  @Expose()
  occupancy!: number;

  @ApiProperty({
    description: 'Services offered in the room',
    example: ['free wifi', 'minibar', 'air conditioning', 'TV'],
    type: [String],
  })
  @Expose()
  services!: string[];

  @ApiProperty({
    description: 'Images of the room',
    example: ['https://example.com/room1.jpg', 'https://example.com/room2.jpg'],
    type: [String],
  })
  @Expose()
  images!: string[];

  @ApiProperty({
    description: 'Maximum quantity of this room type available',
    example: 5,
  })
  @Expose()
  maxQuantity!: number;
}

@Exclude()
export class DeletedRoomResponseDto extends RoomResponseDto {
  @ApiProperty({
    description: 'The timestamp when the room was deleted',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  deleteTimestamp!: Date;
}

export class CreateRoomDto {
  @ApiProperty({
    description: 'The name of the room',
    example: 'Deluxe Ocean View Suite',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'The ID of the hotel this room belongs to',
    example: 'eb4ddc1f-e320-4fbb-8bfa-eed8b06d64aa',
  })
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  hotel!: string;

  @ApiProperty({
    description: 'The rate (price) of the room per night',
    example: 150,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  rate!: number;

  @ApiProperty({
    description: 'The size of the room in square meters',
    example: 35,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  size!: number;

  @ApiProperty({
    description: 'Maximum number of people that can stay in the room',
    example: 2,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  occupancy!: number;

  @ApiProperty({
    description: 'Services offered in the room',
    example: ['free wifi', 'minibar', 'air conditioning', 'TV'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @ApiProperty({
    description: 'Images of the room',
    example: ['https://example.com/room1.jpg', 'https://example.com/room2.jpg'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    description: 'Maximum quantity of this room type available',
    example: 5,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxQuantity!: number;
}

export class UpdateRoomDto {
  @ApiProperty({
    description: 'The name of the room',
    example: 'Deluxe Ocean View Suite',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'The rate (price) of the room per night',
    example: 150,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  rate?: number;

  @ApiProperty({
    description: 'The size of the room in square meters',
    example: 35,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  size?: number;

  @ApiProperty({
    description: 'Maximum number of people that can stay in the room',
    example: 2,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  occupancy?: number;

  @ApiProperty({
    description: 'Services offered in the room',
    example: ['free wifi', 'minibar', 'air conditioning', 'TV'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @ApiProperty({
    description: 'Images of the room',
    example: ['https://example.com/room1.jpg', 'https://example.com/room2.jpg'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    description: 'Maximum quantity of this room type available',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxQuantity?: number;
}

export class RoomQueryDto {
  @ApiProperty({
    description: 'Filter rooms by hotel ID',
    example: '60d21b4667d0d8992e610c85',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsMongoId()
  hotel?: string;

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
  @IsNumber()
  @Type(() => Number)
  minRate?: number;

  @ApiProperty({
    description: 'Filter rooms by maximum rate',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxRate?: number;

  @ApiProperty({
    description: 'Filter rooms by minimum occupancy',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minOccupancy?: number;

  @ApiProperty({
    description: 'Filter rooms by services offered',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];
}
