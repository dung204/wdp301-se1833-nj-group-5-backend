import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

import { SwaggerExamples } from '@/base/constants';
import { SchemaResponseDto } from '@/base/dtos';
import { transformToStringArray } from '@/base/utils';
import { Role } from '@/modules/auth/enums/role.enum';
import { HotelResponseDto } from '@/modules/hotels/dtos/hotel.dto';

import { Gender } from '../enums/gender.enum';

@Exclude()
export class UserProfileDto extends SchemaResponseDto {
  @ApiProperty({
    description: 'The email of the user',
    example: SwaggerExamples.EMAIL,
  })
  @Expose()
  email!: string;

  @ApiProperty({
    description: 'The role of the user',
    example: SwaggerExamples.ROLE,
  })
  @Expose()
  role!: Role;

  @ApiProperty({
    description: 'The full name of the user',
    example: SwaggerExamples.FULLNAME,
  })
  @Expose()
  fullName!: string;

  @ApiProperty({
    description: 'The gender of the user',
    enum: Gender,
    enumName: 'Gender',
    example: SwaggerExamples.GENDER,
  })
  @Expose()
  gender!: Gender | null;

  @ApiProperty({
    description: 'The favorite hotels of the user',
    type: [HotelResponseDto],
    required: false,
  })
  @Expose()
  @Type(() => HotelResponseDto)
  favoriteHotels?: HotelResponseDto[];
}

@Exclude()
export class DeletedUserProfileDto extends UserProfileDto {
  @ApiProperty({
    description: 'The timestamp indicating when the item is deleted',
    example: SwaggerExamples.DATE_FROM,
  })
  @Expose()
  deleteTimestamp!: Date;
}

export class UpdateUserDto {
  @ApiProperty({
    description: 'The full name of the user',
    example: SwaggerExamples.FULLNAME,
    required: false,
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    description: 'The gender of the user',
    enum: Gender,
    enumName: 'Gender',
    example: SwaggerExamples.GENDER,
    required: false,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({
    description: 'The list of favorite hotels',
    example: SwaggerExamples.ACCEPT_HOTEL,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(transformToStringArray)
  favoriteHotels?: string[];
}

export class UpgradeRoleDto {
  @ApiProperty({
    description: 'The target role to upgrade to',
    enum: [Role.HOTEL_OWNER],
    enumName: 'UpgradeRole',
    example: Role.HOTEL_OWNER,
    required: true,
  })
  @IsEnum([Role.HOTEL_OWNER], {
    message: 'Only upgrade to HOTEL_OWNER role is supported',
  })
  targetRole!: Role.HOTEL_OWNER;

  @ApiProperty({
    description: 'Optional justification for the role upgrade',
    example: 'I want to add my hotel to the system',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
