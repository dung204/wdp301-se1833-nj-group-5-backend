import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { ApiSuccessResponse } from '@/base/decorators';
import { AllowRoles } from '@/modules/auth/decorators/allow-roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Role } from '@/modules/auth/enums/role.enum';
import { BookingResponseDto, CreateBookingDto } from '@/modules/bookings/dtos/booking.dto';
import { Booking } from '@/modules/bookings/schemas/booking.schema';
import { BookingsService } from '@/modules/bookings/services/bookings.service';
import { User } from '@/modules/users/schemas/user.schema';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  private transformToDto(data: Booking | Booking[]): BookingResponseDto | BookingResponseDto[] {
    return plainToInstance(BookingResponseDto, data);
  }

  //
  @ApiOperation({
    summary: 'Search filter hotels, get all hotels, get hotel by ID',
    description: 'Search hotels with pagination, sorting and filtering options',
  })
  @ApiSuccessResponse({
    schema: BookingResponseDto,
    description: 'Hotels retrieved successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER, Role.CUSTOMER])
  @Post('/')
  async BookingHotel(@CurrentUser() user: User, @Body() createBookingDto: CreateBookingDto) {
    const result = await this.bookingsService.createBooking(user, createBookingDto);

    return this.transformToDto(result);
  }
}
