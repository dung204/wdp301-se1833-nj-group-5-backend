import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiNoContentResponse, ApiOperation, ApiParam } from '@nestjs/swagger';

import { ApiSuccessResponse } from '@/base/decorators';
import { transformDataToDto } from '@/base/utils';
import { AllowRoles } from '@/modules/auth/decorators/allow-roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { Role } from '@/modules/auth/enums/role.enum';
import { User } from '@/modules/users/schemas/user.schema';

import {
  CreateHotelDto,
  DeletedHotelResponseDto,
  DeletedHotelsWithAvailabilityResponseDto,
  HotelQueryDto,
  HotelQueryDtoForAdmin,
  HotelResponseDto,
  HotelsWithAvailabilityResponseDto,
  UpdateHotelDto,
} from '../dtos/hotel.dto';
import { Hotel } from '../schemas/hotel.schema';
import { HotelsService } from '../services/hotels.service';

export interface HotelWithRooms extends Hotel {
  rooms?: {
    totalRooms: number;
    bookedRooms: number;
    availableRooms: number;
  };
}

@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @ApiOperation({
    summary: 'Search filter hotels, get all hotels, get hotel by ID',
    description: 'Search hotels with pagination, sorting and filtering options',
  })
  @ApiSuccessResponse({
    schema: HotelResponseDto,
    isArray: true,
    description: 'Hotels retrieved successfully',
  })
  @Public()
  @Get('/')
  async searchHotels(@Query() hotelQueryDto: HotelQueryDto) {
    const result = await this.hotelsService.find({
      queryDto: hotelQueryDto,
      filter: { deleteTimestamp: null },
    });

    const checkIn = hotelQueryDto.checkIn || new Date(new Date().setHours(0, 0, 0, 0));
    const checkOut = hotelQueryDto.checkOut || new Date(new Date().setHours(23, 59, 59, 999));

    const hotelsWithRoomsAvailability = await this.setRoomsAvailabilityInHotels(
      result.data as HotelWithRooms[],
      checkIn,
      checkOut,
      hotelQueryDto,
    );

    return {
      data: transformDataToDto(HotelsWithAvailabilityResponseDto, hotelsWithRoomsAvailability),
      metadata: result.metadata,
    };
  }

  @ApiOperation({
    summary: 'Get all hotels including deleted ones (Admin and hotel owner only)',
    description:
      'Retrieve all hotels with pagination, sorting and filtering options, including soft-deleted hotels',
  })
  @ApiSuccessResponse({
    schema: HotelResponseDto,
    isArray: true,
    description: 'All hotels retrieved successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER])
  @Get('/admin/')
  async getAllHotelsForAdmin(
    @CurrentUser() user: User,
    @Query() hotelQueryDto: HotelQueryDtoForAdmin,
  ) {
    const result = await this.hotelsService.find(
      {
        queryDto: hotelQueryDto,
      },
      user,
    );

    const checkIn = hotelQueryDto.checkIn || new Date(new Date().setHours(0, 0, 0, 0));
    const checkOut = hotelQueryDto.checkOut || new Date(new Date().setHours(23, 59, 59, 999));

    const hotelsWithRoomsAvailability = await this.setRoomsAvailabilityInHotels(
      result.data as HotelWithRooms[],
      checkIn,
      checkOut,
      hotelQueryDto,
    );

    return {
      data: transformDataToDto(
        DeletedHotelsWithAvailabilityResponseDto,
        hotelsWithRoomsAvailability,
      ),
      metadata: result.metadata,
    };
  }

  @ApiOperation({
    summary: 'Create a new hotel',
    description: 'Create a new hotel with the current user as owner',
  })
  @ApiConsumes('multipart/form-data')
  @ApiSuccessResponse({
    schema: HotelResponseDto,
    description: 'Hotel created successfully',
  })
  @UseInterceptors(FilesInterceptor('images', 10))
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER])
  @Post()
  async createHotel(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 ** 2 }), // 5 MB
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
        fileIsRequired: false,
      }),
    )
    images: Express.Multer.File[],
    @CurrentUser() user: User,
    @Body() createHotelDto: CreateHotelDto,
  ) {
    const hotel = await this.hotelsService.createHotel(user, createHotelDto, images);
    return transformDataToDto(DeletedHotelResponseDto, hotel);
  }

  @ApiOperation({
    summary: 'Update a hotel',
    description: 'Update a hotel (only for owner or admin)',
  })
  @ApiParam({ name: 'id', description: 'Hotel ID' })
  @ApiConsumes('multipart/form-data')
  @ApiSuccessResponse({
    schema: HotelResponseDto,
    description: 'Hotel updated successfully',
  })
  @UseInterceptors(FilesInterceptor('newImages', 10))
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER])
  @Patch(':id')
  async updateHotel(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 ** 2 }), // 5 MB
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
        fileIsRequired: false,
      }),
    )
    newImages: Express.Multer.File[],
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateHotelDto: UpdateHotelDto,
  ) {
    return transformDataToDto(
      DeletedHotelResponseDto,
      await this.hotelsService.update(
        { ...updateHotelDto, newImages } as Partial<Hotel>,
        { _id: id },
        user,
      ),
    );
  }

  @ApiOperation({
    summary: 'Delete a hotel',
    description: 'Soft delete a hotel (only for owner or admin)',
  })
  @ApiParam({ name: 'id', description: 'Hotel ID' })
  @ApiNoContentResponse({
    description: 'Hotel deleted successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER])
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteHotel(@CurrentUser() user: User, @Param('id') id: string) {
    // return this.hotelsService.softDelete({_id: id}, user);
    return this.hotelsService.deleteHotel(user, id);
  }

  @ApiOperation({
    summary: 'Restore a hotel',
    description: 'Restore a hotel (only for owner or admin)',
  })
  @ApiParam({ name: 'id', description: 'Hotel ID' })
  @ApiSuccessResponse({
    schema: HotelResponseDto,
    description: 'Hotel restore successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER])
  @Patch('restore/:id')
  @HttpCode(HttpStatus.OK)
  async restoreHotel(@Param('id') id: string, @CurrentUser() user: User) {
    const result = await this.hotelsService.restore(
      {
        _id: id,
      },
      user,
    );

    return transformDataToDto(DeletedHotelResponseDto, result);
  }

  //
  private async setRoomsAvailabilityInHotels(
    hotels: HotelWithRooms[],
    checkIn: Date,
    checkOut: Date,
    hotelQueryDto: HotelQueryDto,
  ): Promise<HotelWithRooms[]> {
    const hotelsWithAvailability = await this.hotelsService.searchHotelsWithAvailability(
      hotelQueryDto,
      checkIn,
      checkOut,
    );

    // Add room availability information to each hotel in result
    hotels.forEach((hotel: HotelWithRooms) => {
      const findHotel = hotelsWithAvailability.find(
        (item) => item._id.toString() === hotel._id.toString(),
      );

      // If the hotel is found in the availability search, add room information
      if (findHotel) {
        hotel['rooms'] = {
          totalRooms: findHotel.totalRooms || 0,
          bookedRooms: findHotel.totalBookedRooms || 0,
          availableRooms: findHotel.availableRooms || 0,
        };
      }
    });

    return hotels;
  }
}
