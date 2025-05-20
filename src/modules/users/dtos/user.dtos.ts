import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { SwaggerExamples } from '@/base/constants';
import { SchemaResponseDto } from '@/base/dtos';
import { Role } from '@/modules/auth/enums/role.enum';

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
}
