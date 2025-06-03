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
  Query,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOperation, ApiParam } from '@nestjs/swagger';

import { ApiSuccessResponse } from '@/base/decorators';
import { QueryDto } from '@/base/dtos';
import { AllowRoles } from '@/modules/auth/decorators/allow-roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { Role } from '@/modules/auth/enums/role.enum';
import { User } from '@/modules/users/schemas/user.schema';

import {
  CreateDiscountDto,
  DiscountQueryDto,
  DiscountResponseDto,
  UpdateDiscountDto,
} from '../dtos/discount.dto';
import { DiscountsService } from '../services/discounts.service';

@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

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
  @Get('/')
  async searchDiscounts(@Query() queryDto: QueryDto, @Query() discountQueryDto: DiscountQueryDto) {
    return this.discountsService.findDiscounts({ queryDto, discountQueryDto });
  }

  @ApiOperation({
    summary: 'Create a new discount',
    description: 'Create a new discount (admin only)',
  })
  @ApiSuccessResponse({
    schema: DiscountResponseDto,
    description: 'Discount created successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER])
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
  @AllowRoles([Role.ADMIN])
  @Patch(':id')
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
  @AllowRoles([Role.ADMIN])
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDiscount(@CurrentUser() user: User, @Param('id') id: string) {
    return this.discountsService.deleteDiscount(user, id);
  }

  @ApiOperation({
    summary: 'Restore a discount',
    description: 'Soft restore a discount (admin only)',
  })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiNoContentResponse({
    description: 'Discount restored successfully',
  })
  @AllowRoles([Role.ADMIN])
  @Delete('restore/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async restoreDiscount(@CurrentUser() user: User, @Param('id') id: string) {
    return this.discountsService.restore({
      _id: id,
    });
  }
}
