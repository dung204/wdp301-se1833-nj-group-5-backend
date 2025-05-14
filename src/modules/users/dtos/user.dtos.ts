import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, plainToInstance } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { SwaggerExamples } from '@/base/constants';
import { Role } from '@/modules/auth';

import { User } from '../entities/user.entity';
import { Gender } from '../enums/gender.enum';

@Exclude()
export class UserProfileDto {
  @ApiProperty({
    description: 'The UUID of the user',
    example: SwaggerExamples.UUID,
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'The email of the user',
    example: SwaggerExamples.EMAIL,
  })
  @Expose()
  @Transform(({ obj: user }) => user.account.email)
  email!: string;

  @ApiProperty({
    description: 'The role of the user',
    example: SwaggerExamples.ROLE,
  })
  @Expose()
  @Transform(({ obj: user }) => user.account.role)
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
    description: 'The timestamp indicating when the user is created',
    example: SwaggerExamples.DATE_FROM,
  })
  @Expose()
  createTimestamp!: Date;

  @ApiProperty({
    description: 'The timestamp indicating when the user is last updated',
    example: SwaggerExamples.DATE_FROM,
  })
  @Expose()
  updateTimestamp!: Date;

  public static fromUser(user: User) {
    return plainToInstance(UserProfileDto, user);
  }
}

@Exclude()
export class DeletedUserProfileDto extends UserProfileDto {
  @ApiProperty({
    description: 'The timestamp indicating when the user is deleted',
    example: SwaggerExamples.DATE_FROM,
  })
  @Expose()
  deleteTimestamp!: Date;

  public static fromUser(user: User) {
    return plainToInstance(DeletedUserProfileDto, user);
  }
}

export class UpdateUserDto {
  @ApiHideProperty()
  @Exclude()
  id!: string;

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
