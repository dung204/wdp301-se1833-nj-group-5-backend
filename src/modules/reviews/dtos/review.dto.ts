import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

import { QueryDto, SchemaResponseDto } from '@/base/dtos';
import { transformToFloatNumber } from '@/base/utils/transform.utils';
import { HotelResponseDto } from '@/modules/hotels/dtos/hotel.dto';
import { UserProfileDto } from '@/modules/users/dtos/user.dtos';

@Exclude()
export class ReviewResponseDto extends SchemaResponseDto {
  @ApiProperty({
    description: 'The user who wrote the review',
    type: UserProfileDto,
  })
  @Expose()
  @Type(() => UserProfileDto)
  user!: UserProfileDto;

  @ApiProperty({
    description: 'The hotel being reviewed',
    type: HotelResponseDto,
  })
  @Expose()
  @Type(() => HotelResponseDto)
  hotel!: HotelResponseDto;

  @ApiProperty({
    description: 'The content of the review',
    example: 'Great hotel with excellent service!',
  })
  @Expose()
  content!: string;

  @ApiProperty({
    description: 'Rating given by the user (1-5)',
    example: 5,
  })
  @Expose()
  rating!: number;
}

export class CreateReviewDto {
  @ApiProperty({
    description: 'The hotel ID being reviewed',
    example: 'eb4ddc1f-e320-4fbb-8bfa-eed8b06d64aa',
  })
  @IsNotEmpty()
  @IsString()
  hotel!: string;

  @ApiProperty({
    description: 'The content of the review',
    example: 'Great hotel with excellent service!',
  })
  @IsNotEmpty()
  @IsString()
  content!: string;

  @ApiProperty({
    description: 'Rating given by the user (1-5)',
    example: 5,
    type: Number,
    minimum: 1,
    maximum: 5,
  })
  @IsNotEmpty()
  @Transform(transformToFloatNumber) // 1. Transform đứng trước
  @IsNumber({}, { message: 'Rating must be a number' }) // 2. IsNumber đứng sau
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  rating!: number;
}

export class UpdateReviewDto {
  @ApiProperty({
    description: 'The content of the review',
    example: 'Great hotel with excellent service!',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    description: 'Rating given by the user (1-5)',
    example: 5,
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber) // 1. Transform đứng trước
  @IsNumber({}, { message: 'Rating must be a number' }) // 2. IsNumber đứng sau
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  rating?: number;
}

export class ReviewQueryDto extends QueryDto {
  @ApiProperty({
    description: 'Filter reviews by review ID',
    required: false,
    example: 'bcbb434f-7aea-474e-ba12-d9968400ddb0',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Filter reviews by hotel ID',
    required: false,
    example: 'eb4ddc1f-e320-4fbb-8bfa-eed8b06d64aa',
  })
  @IsOptional()
  @IsString()
  hotel?: string;

  @ApiProperty({
    description: 'Filter reviews by user ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  user?: string;

  @ApiProperty({
    description: 'Filter reviews by minimum rating',
    required: false,
  })
  @IsOptional()
  @Transform(transformToFloatNumber) // 1. Transform đứng trước
  @IsNumber({}, { message: 'Min rating must be a number' }) // 2. IsNumber đứng sau
  @Min(1, { message: 'Min rating must be at least 1' })
  @Max(5, { message: 'Min rating must not exceed 5' })
  minRating?: number;
}
