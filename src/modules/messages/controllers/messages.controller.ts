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
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { ApiSuccessResponse } from '@/base/decorators';
import { transformDataToDto } from '@/base/utils';
import { AllowRoles } from '@/modules/auth/decorators/allow-roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Role } from '@/modules/auth/enums/role.enum';
import { User } from '@/modules/users/schemas/user.schema';

import {
  ConversationResponseDto,
  CreateMessageDto,
  MessageQueryDto,
  MessageResponseDto,
} from '../dtos';
import { MessagesService } from '../services';

@ApiTags('Messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @ApiOperation({
    summary: 'Send a new message',
    description:
      'Send a message in a conversation. Hotel owners can initiate conversations with customers after paid bookings. Both parties can reply to existing conversations.',
  })
  @ApiSuccessResponse({
    schema: MessageResponseDto,
    description: 'Message sent successfully',
  })
  @AllowRoles([Role.HOTEL_OWNER, Role.CUSTOMER])
  @Post()
  async sendMessage(@CurrentUser() user: User, @Body() createMessageDto: CreateMessageDto) {
    const message = await this.messagesService.createMessage(user, createMessageDto);
    return transformDataToDto(MessageResponseDto, message);
  }

  @ApiOperation({
    summary: 'Get messages',
    description: 'Get messages with filtering options. Users can only see their own messages.',
  })
  @ApiSuccessResponse({
    schema: MessageResponseDto,
    isArray: true,
    description: 'Messages retrieved successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER, Role.CUSTOMER])
  @Get()
  async getMessages(@CurrentUser() user: User, @Query() messageQueryDto: MessageQueryDto) {
    const result = await this.messagesService.find({ queryDto: messageQueryDto }, user);
    return {
      data: transformDataToDto(MessageResponseDto, result.data),
      metadata: result.metadata,
    };
  }

  @ApiOperation({
    summary: 'Get conversations',
    description: 'Get all conversations (grouped by booking) where the user is a participant.',
  })
  @ApiSuccessResponse({
    schema: ConversationResponseDto,
    isArray: true,
    description: 'Conversations retrieved successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER, Role.CUSTOMER])
  @Get('conversations')
  async getConversations(@CurrentUser() user: User, @Query() messageQueryDto: MessageQueryDto) {
    const conversations = await this.messagesService.getConversations(user, messageQueryDto);
    return {
      data: transformDataToDto(ConversationResponseDto, conversations),
      metadata: {
        totalCount: conversations.length,
        pageSize: conversations.length,
        currentPage: 1,
        totalPages: 1,
      },
    };
  }

  @ApiOperation({
    summary: 'Get messages in a conversation',
    description: 'Get all messages for a specific booking (conversation).',
  })
  @ApiParam({ name: 'bookingId', description: 'Booking ID' })
  @ApiSuccessResponse({
    schema: MessageResponseDto,
    isArray: true,
    description: 'Conversation messages retrieved successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER, Role.CUSTOMER])
  @Get('conversations/:bookingId')
  async getConversationMessages(
    @CurrentUser() user: User,
    @Param('bookingId') bookingId: string,
    @Query() messageQueryDto: MessageQueryDto,
  ) {
    const queryDto = { ...messageQueryDto, booking: bookingId };
    const result = await this.messagesService.find({ queryDto }, user);
    return {
      data: transformDataToDto(MessageResponseDto, result.data),
      metadata: result.metadata,
    };
  }

  @ApiOperation({
    summary: 'Mark message as read',
    description:
      'Mark a specific message as read. Only the receiver can mark their messages as read.',
  })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiSuccessResponse({
    schema: MessageResponseDto,
    description: 'Message marked as read successfully',
  })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER, Role.CUSTOMER])
  @Patch(':messageId/read')
  async markAsRead(@CurrentUser() user: User, @Param('messageId') messageId: string) {
    const message = await this.messagesService.markAsRead(user, messageId);
    return transformDataToDto(MessageResponseDto, message);
  }

  @ApiOperation({
    summary: 'Delete a message',
    description: 'Soft delete a message. Users can only delete their own sent messages.',
  })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @AllowRoles([Role.ADMIN, Role.HOTEL_OWNER, Role.CUSTOMER])
  @Delete(':messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessage(@CurrentUser() user: User, @Param('messageId') messageId: string) {
    await this.messagesService.softDelete({ _id: messageId, sender: user._id }, user);
  }
}
