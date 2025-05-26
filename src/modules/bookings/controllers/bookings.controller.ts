import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Role } from '@/modules/auth/enums/role.enum';
import { User } from '@/modules/users/schemas/user.schema';

import { BookingsSearchDto, CreateBookingDto, UpdateBookingDto } from '../dtos/bookings.dtos';
import { BookingStatus } from '../enums/booking-status.enum';
import { BookingsService } from '../services/bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @ApiOperation({
    summary: 'Get all bookings',
    description: `- If user's role is \`${Role.ADMIN}\`, all query parameters below will be applied.\n- If user's role is \`${Role.HOTEL_OWNER}\`, the \`hotel\` parameter will be set to the owner's hotel ID.\n- If user's role is \`${Role.CUSTOMER}\`, the \`user\` parameter will be set to the customer's ID`,
  })
  @Get('/')
  async findAllBookings(@Query() bookingsSearchDto: BookingsSearchDto, @CurrentUser() user: User) {
    return this.bookingsService.find(
      {
        queryDto: bookingsSearchDto,
      },
      user,
    );
  }

  @ApiOperation({
    summary: 'Create a booking',
  })
  @Post('/')
  async createBooking(@CurrentUser() user: User, @Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.createOne(createBookingDto, user);
  }

  @ApiOperation({
    summary: 'Update a booking',
  })
  @Patch('/:id')
  async updateBooking(
    @CurrentUser() user: User,
    @Body() updateBookingDto: UpdateBookingDto,
    @Param('id') bookingId: string,
  ) {
    return this.bookingsService.update(
      updateBookingDto,
      {
        _id: bookingId,
      },
      user,
    );
  }

  @ApiOperation({
    summary: 'Cancel a booking',
  })
  @Delete('/:id')
  async cancelBooking(@CurrentUser() user: User, @Param('id') bookingId: string) {
    return this.bookingsService.update(
      {
        status: BookingStatus.CANCELLED,
      },
      { _id: bookingId },
      user,
    );
  }
}
