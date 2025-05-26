import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery } from 'mongoose';

import { BaseService, FindManyOptions } from '@/base/services';
import { DateTimeUtils } from '@/base/utils';
import { Role } from '@/modules/auth/enums/role.enum';
import { DiscountsService } from '@/modules/discounts/services/discounts.service';
import { HotelsService } from '@/modules/hotels/services/hotels.service';
import { RoomsService } from '@/modules/rooms/services/rooms.service';
import { User } from '@/modules/users/schemas/user.schema';

import { BookingsSearchDto, CreateBookingDto } from '../dtos/bookings.dtos';
import { Booking } from '../schemas/booking.schema';

@Injectable()
export class BookingsService extends BaseService<Booking> {
  constructor(
    @InjectModel(Booking.name) protected readonly model: Model<Booking>,
    private readonly roomsService: RoomsService,
    private readonly discountsService: DiscountsService,
    private readonly hotelsService: HotelsService,
  ) {
    const logger = new Logger(BookingsService.name);
    super(model, logger);
  }

  protected async preFind(
    options: FindManyOptions<Booking>,
    currentUser?: User,
  ): Promise<FindManyOptions<Booking>> {
    const preProcessedOptions = super.preFind(options, currentUser);
    const {
      page,
      pageSize,
      order,
      status,
      fromCheckIn,
      toCheckIn,
      fromCheckOut,
      toCheckOut,
      fromTotalPrice,
      toTotalPrice,
      ...otherFilters
    } = (options.queryDto ?? {}) as BookingsSearchDto;

    const filterQuery: RootFilterQuery<Booking> = {
      ...(status.length !== 0 && { status: { $in: status } }),
      ...(fromCheckIn && { $gte: fromCheckIn }),
      ...(toCheckIn && { $lte: toCheckIn }),
      ...(fromCheckOut && { $gte: fromCheckOut }),
      ...(toCheckOut && { $lte: toCheckOut }),
      ...(fromTotalPrice && { $gte: fromTotalPrice }),
      ...(toTotalPrice && { $lte: toTotalPrice }),
      ...otherFilters,
    };

    switch (currentUser?.role) {
      case Role.ADMIN:
        return {
          ...preProcessedOptions,
          filter: {
            ...preProcessedOptions.filter,
            ...filterQuery,
          },
        };
      case Role.HOTEL_OWNER: {
        const hotel = await this.hotelsService.findOne({ owner: currentUser });

        return {
          ...preProcessedOptions,
          filter: {
            ...preProcessedOptions.filter,
            ...filterQuery,
            hotel: hotel?._id,
          },
        };
      }
      case Role.CUSTOMER:
        return {
          ...preProcessedOptions,
          filter: {
            ...preProcessedOptions.filter,
            ...filterQuery,
            user: currentUser,
          },
        };
      default:
        throw new ForbiddenException(`Operation is not allowed for role ${currentUser?.role}`);
    }
  }

  protected async preCreateOne(
    createDto: CreateBookingDto,
    currentUser?: User,
  ): Promise<Partial<Booking>> {
    const { checkIn, checkOut, discount, room } = createDto;

    if (DateTimeUtils.diffInDays(new Date(checkIn), new Date(checkOut)) < 1) {
      throw new BadRequestException('checkIn must be smaller than checkOut');
    }

    const existedRoom = await this.roomsService.findOne({
      _id: room,
    });

    if (!existedRoom) {
      throw new NotFoundException('Room not found!');
    }

    const discounts = (
      await this.discountsService.find({
        filter: { _id: { $in: discount } },
      })
    ).data;

    return {
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      room: existedRoom,
      discounts,
      user: currentUser,
      hotel: existedRoom.hotel,
    };
  }
}
