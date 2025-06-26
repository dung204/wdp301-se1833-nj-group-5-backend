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
import { transformDataToDto } from '@/base/utils';
import { AllowRoles } from '@/modules/auth/decorators/allow-roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { Role } from '@/modules/auth/enums/role.enum';
import { User } from '@/modules/users/schemas/user.schema';

import {
  CreateReviewDto,
  ReviewQueryDto,
  ReviewResponseDto,
  UpdateReviewDto,
} from '../dtos/review.dto';
import { ReviewsService } from '../services/reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({
    summary: 'Search and filter reviews and get all active reviews',
    description: 'Search reviews with pagination, sorting and filtering options',
  })
  @ApiSuccessResponse({
    schema: ReviewResponseDto,
    isArray: true,
    description: 'Reviews retrieved successfully',
  })
  @Public()
  @Get('/')
  async searchReviews(@Query() reviewQueryDto: ReviewQueryDto) {
    const result = await this.reviewsService.find({ queryDto: reviewQueryDto });

    return {
      data: transformDataToDto(ReviewResponseDto, result.data),
      metaData: result.metadata,
    };
  }

  @ApiOperation({
    summary: 'Create a new review',
    description: 'Create a new review for a hotel',
  })
  @ApiSuccessResponse({
    schema: ReviewResponseDto,
    description: 'Review created successfully',
  })
  @Post()
  async createReview(@CurrentUser() user: User, @Body() createReviewDto: CreateReviewDto) {
    const review = await this.reviewsService.createReview(user, createReviewDto);
    return transformDataToDto(ReviewResponseDto, review);
  }

  @ApiOperation({
    summary: 'Update a review',
    description: 'Update a review (only for review owner or admin)',
  })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiSuccessResponse({
    schema: ReviewResponseDto,
    description: 'Review updated successfully',
  })
  @Patch(':id')
  async updateReview(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return transformDataToDto(
      ReviewResponseDto,
      await this.reviewsService.updateReview(user, id, updateReviewDto),
    );
  }

  @ApiOperation({
    summary: 'Delete a review',
    description: 'Soft delete a review (only for review owner or admin)',
  })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiNoContentResponse({
    description: 'Review deleted successfully',
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReview(@CurrentUser() user: User, @Param('id') id: string) {
    return transformDataToDto(ReviewResponseDto, this.reviewsService.deleteReview(user, id));
  }

  @ApiOperation({
    summary: 'Restore a deleted user by id',
  })
  @ApiSuccessResponse({
    schema: ReviewResponseDto,
    description: 'Review restored successfully',
  })
  @AllowRoles([Role.ADMIN])
  @ApiSuccessResponse({
    schema: ReviewResponseDto,
    description: 'Review restored successfully',
  })
  @Patch('/restore/:id')
  async restoreUser(@CurrentUser() currentUser: User, @Param('id') id: string) {
    return transformDataToDto(
      ReviewResponseDto,
      this.reviewsService.restore(
        {
          _id: id,
        },
        currentUser,
      ),
    );
  }
}
