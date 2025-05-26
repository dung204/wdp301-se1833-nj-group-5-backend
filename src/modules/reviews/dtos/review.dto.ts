import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

import { SchemaResponseDto } from '@/base/dtos';
import { HotelResponseDto } from '@/modules/hotels/dtos/hotel.dto';
import { UserProfileDto } from '@/modules/users/dtos/user.dtos';

@Exclude()
export class ReviewResponseDto extends SchemaResponseDto {
  @ApiProperty({
    description: 'The user who wrote the review',
    type: UserProfileDto,
  })
  @Expose()
  user!: UserProfileDto;

  @ApiProperty({
    description: 'The hotel being reviewed',
    type: HotelResponseDto,
  })
  @Expose()
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
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(5)
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
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}

export class ReviewQueryDto {
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
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;
}
