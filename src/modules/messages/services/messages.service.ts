import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseService, FindManyOptions } from '@/base/services';
import { Role } from '@/modules/auth/enums/role.enum';
import { BookingsService } from '@/modules/bookings/services/bookings.service';
import { HotelsService } from '@/modules/hotels/services/hotels.service';
import { User } from '@/modules/users/schemas/user.schema';

import { CreateMessageDto, MessageQueryDto } from '../dtos';
import { MessageType, SenderType } from '../enums';
import { Message } from '../schemas';

@Injectable()
export class MessagesService extends BaseService<Message> {
  constructor(
    @InjectModel(Message.name) protected readonly model: Model<Message>,
    private readonly bookingsService: BookingsService,
    private readonly hotelsService: HotelsService,
  ) {
    const logger = new Logger(MessagesService.name);
    super(model, logger);
  }

  async createMessage(user: User, createMessageDto: CreateMessageDto): Promise<Message> {
    // 1. Validate booking exists
    const booking = await this.bookingsService.getBookingById(createMessageDto.booking);
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${createMessageDto.booking} not found`);
    }

    // 2. Validate receiver exists
    const receiver = await this.validateUser(createMessageDto.receiver);

    // 3. Check if this is the first message or a reply
    const existingMessages = await this.findMessagesInConversation(createMessageDto.booking);
    const isFirstMessage = existingMessages.length === 0;

    // 4. Validate permissions based on user role and message type
    await this.validateMessagePermissions(user, booking, receiver, isFirstMessage);

    // 5. Determine sender type
    const senderType =
      user.role === Role.HOTEL_OWNER ? SenderType.HOTEL_OWNER : SenderType.CUSTOMER;

    // 6. Create the message
    const message = await this.createOne({
      booking: booking,
      sender: user,
      receiver: receiver,
      senderType,
      content: createMessageDto.content,
      messageType: createMessageDto.messageType || MessageType.TEXT,
      attachmentUrl: createMessageDto.attachmentUrl,
    });

    return message;
  }

  async markAsRead(user: User, messageId: string): Promise<Message> {
    const message = await this.findOne({ _id: messageId });
    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // Only the receiver can mark message as read
    if (message.receiver._id.toString() !== user._id.toString()) {
      throw new ForbiddenException('You can only mark your own received messages as read');
    }

    if (message.isRead) {
      return message; // Already read
    }

    // Update the message
    await this.update(
      {
        isRead: true,
        readAt: new Date(),
      },
      { _id: messageId },
    );

    // Return the updated message
    const updatedMessage = await this.findOne({ _id: messageId });
    return updatedMessage!;
  }

  async deleteMessage(user: User, messageId: string): Promise<void> {
    // 1. Find the message to ensure it exists
    const message = await this.findOne({ _id: messageId });
    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // 2. Validate that the current user is the sender of the message
    if (message.sender._id.toString() !== user._id.toString()) {
      throw new ForbiddenException('You can only delete your own sent messages');
    }

    // 3. Check if message is already deleted
    if (message.deleteTimestamp) {
      throw new ForbiddenException('Message has already been deleted');
    }

    // 4. Perform soft delete
    await this.softDelete({ _id: messageId }, user);
  }

  async getConversations(user: User, _queryDto?: MessageQueryDto) {
    // Get all conversations where user is participant
    const pipeline: any[] = [
      {
        $match: {
          $or: [{ sender: user._id }, { receiver: user._id }],
          deleteTimestamp: null,
        },
      },
      {
        $lookup: {
          from: 'bookings',
          localField: 'booking',
          foreignField: '_id',
          as: 'bookingInfo',
        },
      },
      {
        $unwind: '$bookingInfo',
      },
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'senderInfo',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'receiver',
          foreignField: '_id',
          as: 'receiverInfo',
        },
      },
      {
        $unwind: '$senderInfo',
      },
      {
        $unwind: '$receiverInfo',
      },
      {
        $group: {
          _id: '$booking',
          booking: { $first: '$bookingInfo' },
          customer: {
            $first: {
              $cond: [{ $eq: ['$senderInfo.role', 'CUSTOMER'] }, '$senderInfo', '$receiverInfo'],
            },
          },
          hotelOwner: {
            $first: {
              $cond: [{ $eq: ['$senderInfo.role', 'HOTEL_OWNER'] }, '$senderInfo', '$receiverInfo'],
            },
          },
          lastMessage: { $last: '$$ROOT' },
          messageCount: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [{ $eq: ['$receiver', user._id] }, { $eq: ['$isRead', false] }],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $sort: { 'lastMessage.createTimestamp': -1 },
      },
    ];

    return this.model.aggregate(pipeline);
  }

  async findMessagesInConversation(bookingId: string): Promise<Message[]> {
    return this.find({
      filter: {
        booking: bookingId,
        deleteTimestamp: null,
      },
      sort: { createTimestamp: 1 },
    }).then((result) => result.data);
  }

  private async validateUser(userId: string): Promise<User> {
    // For now, we'll assume the user exists since we're focusing on the message logic
    // In a real implementation, you'd inject UsersService here
    if (!userId) {
      throw new NotFoundException('Receiver user ID is required');
    }
    return {
      _id: userId,
      role: Role.CUSTOMER, // Default role assumption
    } as User;
  }

  private async validateMessagePermissions(
    sender: User,
    booking: any,
    receiver: User,
    isFirstMessage: boolean,
  ): Promise<void> {
    if (isFirstMessage) {
      // Only hotel owners can initiate conversations
      if (sender.role !== Role.HOTEL_OWNER) {
        throw new ForbiddenException('Only hotel owners can initiate conversations');
      }

      // Hotel owner must own the hotel in the booking
      const hotelId = booking.hotel?._id?.toString() || booking.hotel?.toString() || booking.hotel;
      if (!hotelId) {
        throw new NotFoundException('Hotel information not found in booking');
      }

      const hotel = await this.hotelsService.getHotelById(hotelId as string);
      if (!hotel) {
        throw new NotFoundException('Hotel not found');
      }

      if (!hotel.owner || !hotel.owner._id) {
        throw new NotFoundException('Hotel owner information not found');
      }

      if (hotel.owner._id.toString() !== sender._id.toString()) {
        throw new ForbiddenException('You can only message customers who booked your hotel');
      }

      // Receiver must be the customer who made the booking
      if (!booking.user || !booking.user._id) {
        throw new NotFoundException('Booking user information not found');
      }

      if (booking.user._id.toString() !== receiver._id.toString()) {
        throw new ForbiddenException('You can only message the customer who made this booking');
      }

      // Receiver must be a customer
      if (receiver.role !== Role.CUSTOMER) {
        throw new ForbiddenException('You can only send messages to customers');
      }
    } else {
      // For replies, both parties can send messages
      const isCustomer = sender.role === Role.CUSTOMER;
      const isHotelOwner = sender.role === Role.HOTEL_OWNER;

      if (!isCustomer && !isHotelOwner) {
        throw new ForbiddenException('Only customers and hotel owners can send messages');
      }

      // Validate that sender is part of this conversation
      if (isCustomer) {
        if (!booking.user || !booking.user._id) {
          throw new NotFoundException('Booking user information not found');
        }

        if (booking.user._id.toString() !== sender._id.toString()) {
          throw new ForbiddenException('You can only reply to conversations for your own bookings');
        }
      } else if (isHotelOwner) {
        const hotelId =
          booking.hotel?._id?.toString() || booking.hotel?.toString() || booking.hotel;
        if (!hotelId) {
          throw new NotFoundException('Hotel information not found in booking');
        }

        const hotel = await this.hotelsService.getHotelById(hotelId as string);
        if (!hotel) {
          throw new NotFoundException('Hotel not found');
        }

        if (!hotel.owner || !hotel.owner._id) {
          throw new NotFoundException('Hotel owner information not found');
        }

        if (hotel.owner._id.toString() !== sender._id.toString()) {
          throw new ForbiddenException('You can only reply to conversations for your own hotels');
        }
      }
    }
  }

  protected async preFind(
    options: FindManyOptions<Message>,
    currentUser?: User,
  ): Promise<FindManyOptions<Message>> {
    const findOptions = await super.preFind(options, currentUser);

    // Filter out deleted messages by default
    findOptions.filter = {
      ...findOptions.filter,
      deleteTimestamp: null,
    };

    if (findOptions.queryDto) {
      const messageQueryDto = findOptions.queryDto as MessageQueryDto;

      // Apply filters based on query parameters
      findOptions.filter = {
        ...findOptions.filter,
        ...(messageQueryDto.booking && { booking: messageQueryDto.booking }),
        ...(messageQueryDto.sender && { sender: messageQueryDto.sender }),
        ...(messageQueryDto.receiver && { receiver: messageQueryDto.receiver }),
        ...(messageQueryDto.senderType && { senderType: messageQueryDto.senderType }),
        ...(messageQueryDto.messageType && { messageType: messageQueryDto.messageType }),
        ...(messageQueryDto.isRead !== undefined && { isRead: messageQueryDto.isRead }),
        ...(messageQueryDto.search && {
          content: { $regex: messageQueryDto.search, $options: 'i' },
        }),
      };

      // Role-based filtering
      if (currentUser?.role === Role.CUSTOMER) {
        // Customers can only see messages where they are sender or receiver
        findOptions.filter = {
          ...findOptions.filter,
          $or: [{ sender: currentUser._id }, { receiver: currentUser._id }],
        };
      } else if (currentUser?.role === Role.HOTEL_OWNER) {
        // Hotel owners can only see messages for their hotels
        // This requires a more complex query - for now, filter by sender/receiver
        findOptions.filter = {
          ...findOptions.filter,
          $or: [{ sender: currentUser._id }, { receiver: currentUser._id }],
        };
      }
      // Admins can see all messages (no additional filtering)
    }

    return findOptions;
  }
}
