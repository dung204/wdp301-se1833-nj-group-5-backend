import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOperation, ApiParam } from '@nestjs/swagger';

import { ApiSuccessResponse } from '@/base/decorators';
import { QueryDto } from '@/base/dtos';
import { Admin } from '@/modules/auth/decorators/admin.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { User } from '@/modules/users/schemas/user.schema';

import {
  CreateDiscountDto,
  DiscountQueryDto,
  DiscountResponseDto,
  UpdateDiscountDto,
} from '../dtos/discount.dto';
import { DiscountState } from '../enums/discount.enum';
import { DiscountsService } from '../services/discounts.service';

@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @ApiOperation({
    summary: 'Retrieve all active discounts',
    description: 'Get a list of all active discounts',
  })
  @ApiSuccessResponse({
    schema: DiscountResponseDto,
    isArray: true,
    description: 'Discounts retrieved successfully',
  })
  @Public()
  @Get()
  async getAllDiscounts() {
    return this.discountsService.getAllDiscounts();
  }

  @ApiOperation({
    summary: 'Search and filter discounts',
    description: 'Search discounts with pagination, sorting and filtering options',
  })
  @ApiSuccessResponse({
    schema: DiscountResponseDto,
    isArray: true,
    description: 'Discounts retrieved successfully',
  })
  @Public()
  @Get('/search')
  async searchDiscounts(@Query() queryDto: QueryDto, @Query() discountQueryDto: DiscountQueryDto) {
    return this.discountsService.findDiscounts({ queryDto, discountQueryDto });
  }

  @ApiOperation({
    summary: 'Get a discount by ID',
    description: 'Retrieve detailed information about a specific discount',
  })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiSuccessResponse({
    schema: DiscountResponseDto,
    description: 'Discount retrieved successfully',
  })
  @Public()
  @Get(':id')
  async getDiscountById(@Param('id') id: string) {
    return this.discountsService.getDiscountById(id);
  }

  @ApiOperation({
    summary: 'Create a new discount',
    description: 'Create a new discount (admin only)',
  })
  @ApiSuccessResponse({
    schema: DiscountResponseDto,
    description: 'Discount created successfully',
  })
  @Admin()
  @Post()
  async createDiscount(@CurrentUser() user: User, @Body() createDiscountDto: CreateDiscountDto) {
    return this.discountsService.createDiscount(user, createDiscountDto);
  }

  @ApiOperation({
    summary: 'Update a discount',
    description: 'Update a discount (admin only)',
  })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiSuccessResponse({
    schema: DiscountResponseDto,
    description: 'Discount updated successfully',
  })
  @Admin()
  @Put(':id')
  async updateDiscount(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateDiscountDto: UpdateDiscountDto,
  ) {
    return this.discountsService.updateDiscount(user, id, updateDiscountDto);
  }

  @ApiOperation({
    summary: 'Delete a discount',
    description: 'Soft delete a discount (admin only)',
  })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiNoContentResponse({
    description: 'Discount deleted successfully',
  })
  @Admin()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDiscount(@CurrentUser() user: User, @Param('id') id: string) {
    return this.discountsService.deleteDiscount(user, id);
  }

  @ApiOperation({
    summary: 'Change discount state',
    description: 'Change the state of a discount (admin only)',
  })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiSuccessResponse({
    schema: DiscountResponseDto,
    description: 'Discount state updated successfully',
  })
  @Admin()
  @Patch(':id/state')
  async toggleDiscountState(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('state') state: DiscountState,
  ) {
    return this.discountsService.toggleDiscountState(user, id, state);
  }

  // @ApiOperation({
  //   summary: 'Validate a discount',
  //   description: 'Validate if a discount can be used by a user',
  // })
  // @ApiParam({ name: 'id', description: 'Discount ID' })
  // @ApiSuccessResponse({
  //   schema: DiscountResponseDto,
  //   description: 'Discount validated successfully',
  // })
  // @Get(':id/validate')
  // async validateDiscount(@CurrentUser() user: User, @Param('id') id: string) {
  //   return this.discountsService.validateDiscount(id, user._id.toString());
  // }
}
