import { Body, Controller, Delete, HttpCode, HttpStatus, Post, Request } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ApiSuccessResponse } from '@/base/decorators';
import { CustomRequest } from '@/base/dtos';

import { Public } from '../decorators/public.decorator';
import { LoginDto, LoginSuccessDto, RefreshTokenDto, RegisterDto } from '../dtos/auth.dtos';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({
    summary: 'Login',
  })
  @ApiSuccessResponse({
    schema: LoginSuccessDto,
    isArray: false,
    description: 'Login successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'The email or password is invalid.',
  })
  @Post('/login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @ApiOperation({
    summary: 'Register',
  })
  @ApiSuccessResponse({
    status: HttpStatus.CREATED,
    schema: LoginSuccessDto,
    description: 'Register successfully',
  })
  @ApiConflictResponse({
    description: 'Email already taken',
  })
  @Post('/register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @ApiOperation({
    summary: 'Create new (refresh) tokens',
  })
  @ApiSuccessResponse({
    status: HttpStatus.CREATED,
    schema: LoginSuccessDto,
    description: 'Refresh token successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token is blacklisted',
  })
  @ApiBadRequestResponse({
    description: 'JWT error (malformed, expired, ...)',
  })
  @Post('/refresh')
  async refreshToken(@Body() { refreshToken }: RefreshTokenDto) {
    return this.authService.refresh(refreshToken);
  }

  @ApiOperation({
    summary: 'Logout',
  })
  @ApiNoContentResponse({
    description: 'Logout successfully',
  })
  @Delete('/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Request() req: CustomRequest) {
    // @ts-expect-error authorization does exist in req.headers
    const accessToken: string = req.headers.authorization!.replaceAll('Bearer ', '');
    await this.authService.logout(req.user!, accessToken);
  }
}
