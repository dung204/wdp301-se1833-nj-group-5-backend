import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsJWT, IsNotEmpty, Length } from 'class-validator';

import { SwaggerExamples } from '@/base/constants';
import { Gender } from '@/modules/users/enums/gender.enum';

import { Role } from '../enums/role.enum';

export class LoginDto {
  @ApiProperty({
    description: 'The email address of the user',
    example: SwaggerExamples.EMAIL,
  })
  @IsNotEmpty()
  @IsEmail()
  @Length(6, 256)
  email!: string;

  @ApiProperty({
    description: 'The password of the user',
    example: SwaggerExamples.PASSWORD,
  })
  @IsNotEmpty()
  @Length(8, 100)
  password!: string;
}

export class RegisterDto extends LoginDto {}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'The JWT token to create new (refresh) the access token if it expires',
    example: SwaggerExamples.JWT_REFRESH_TOKEN,
  })
  @IsNotEmpty()
  @IsJWT()
  refreshToken!: string;
}

export class JwtPayloadDto {
  sub!: string;
  exp?: number;
}

class LoginUserPayload {
  @ApiProperty({
    description: 'The UUID of the user',
    example: SwaggerExamples.UUID,
  })
  id!: string;

  @ApiProperty({
    description: 'The role of the user',
    enum: Role,
    enumName: 'Role',
    example: SwaggerExamples.ROLE,
  })
  role!: Role;

  @ApiProperty({
    description: 'The full name of the user',
    example: SwaggerExamples.FULLNAME,
    required: false,
  })
  fullName?: string;

  @ApiProperty({
    description: 'The gender of the user',
    enum: Gender,
    enumName: 'Gender',
    example: SwaggerExamples.GENDER,
    required: false,
  })
  gender?: Gender;
}

export class LoginSuccessDto {
  @ApiProperty({
    description: 'The JWT access token of the user',
    example: SwaggerExamples.JWT_ACCESS_TOKEN,
  })
  accessToken!: string;

  @ApiProperty({
    description: 'The JWT token to create new (refresh) the access token if it expires',
    example: SwaggerExamples.JWT_REFRESH_TOKEN,
  })
  refreshToken!: string;

  @ApiProperty({
    description: 'The user data',
    type: LoginUserPayload,
  })
  user!: LoginUserPayload;
}
