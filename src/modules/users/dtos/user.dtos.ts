import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, plainToInstance } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { SwaggerExamples } from '@/base/constants';
import { Role } from '@/modules/auth/enums/role.enum';

import { Gender } from '../enums/gender.enum';
import { User } from '../schemas/user.schema';

@Exclude()
export class UserProfileDto {
  @ApiProperty({
    description: 'The UUID of the user',
    example: SwaggerExamples.UUID,
  })
  @Transform(({ obj: user }) => user._id)
  @Expose()
  id!: string;

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
