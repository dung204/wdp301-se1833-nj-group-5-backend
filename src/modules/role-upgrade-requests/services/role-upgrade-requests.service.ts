import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseService } from '@/base/services';
import { Role } from '@/modules/auth/enums/role.enum';
import { MailService } from '@/modules/mail/services/mail.service';
import { User } from '@/modules/users/schemas/user.schema';
import { UsersService } from '@/modules/users/services/users.service';

import {
  CreateRoleUpgradeRequestDto,
  UpdateRoleUpgradeRequestDto,
} from '../dtos/role-upgrade-request.dto';
import { RoleUpgradeRequestStatus } from '../enums/role-upgrade-request.enum';
import { RoleUpgradeRequest } from '../schemas/role-upgrade-request.schema';

@Injectable()
export class RoleUpgradeRequestsService extends BaseService<RoleUpgradeRequest> {
  constructor(
    @InjectModel(RoleUpgradeRequest.name)
    private readonly roleUpgradeRequestModel: Model<RoleUpgradeRequest>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {
    const logger = new Logger(RoleUpgradeRequestsService.name);
    super(roleUpgradeRequestModel, logger);
  }

  async createRequest(user: User, createDto: CreateRoleUpgradeRequestDto) {
    // Check if user already has a pending request
    const existingRequest = await this.roleUpgradeRequestModel.findOne({
      user: user._id,
      status: RoleUpgradeRequestStatus.PENDING,
    });

    if (existingRequest) {
      throw new BadRequestException(
        'You already have a pending role upgrade request. Please wait for admin review.',
      );
    }

    // Check if user is eligible for the requested upgrade
    if (user.role !== Role.CUSTOMER) {
      throw new BadRequestException(
        `Cannot upgrade role from ${user.role}. Only CUSTOMER role can request upgrade to HOTEL_OWNER.`,
      );
    }

    if (createDto.targetRole !== Role.HOTEL_OWNER) {
      throw new BadRequestException('Only upgrade to HOTEL_OWNER role is supported.');
    }

    const requestData = {
      user: user._id as any,
      requestType: createDto.requestType,
      currentRole: user.role,
      targetRole: createDto.targetRole,
      contactInfo: createDto.contactInfo,
      reason: createDto.reason,
      status: RoleUpgradeRequestStatus.PENDING,
    };

    const request = await this.createOne(requestData);

    // Send notification email to admin
    try {
      await this.sendMail({
        to: 'tamnguyenvd36@gmail.com',
        subject: `New Role Upgrade Request - ${user.fullName || user.email}`,
        text: `
          New role upgrade request received:

          User: ${user.fullName || user.email} (${user.email})
          Current Role: ${user.role}
          Target Role: ${createDto.targetRole}
          Contact Info: ${createDto.contactInfo}
          Reason: ${createDto.reason}
          Request ID: ${request._id}
        `,
      });
    } catch (error) {
      this.logger.warn('Failed to send admin notification email', error);
    }

    return request;
  }

  async updateRequestStatus(
    requestId: string,
    updateDto: UpdateRoleUpgradeRequestDto,
    adminUser: User,
  ) {
    const request = await this.roleUpgradeRequestModel.findById(requestId);

    if (!request) {
      throw new NotFoundException('Role upgrade request not found');
    }

    if (request.status !== RoleUpgradeRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot update request with status ${request.status}. Only PENDING requests can be updated.`,
      );
    }

    // If approving the request, upgrade the user's role
    if (updateDto.status === RoleUpgradeRequestStatus.APPROVED) {
      const userToUpgrade = await this.usersService.findOne({ _id: request.user });
      if (userToUpgrade) {
        await this.usersService.update({ role: request.targetRole }, { _id: request.user });
      }
    }

    await this.update(
      {
        status: updateDto.status,
        reviewedBy: adminUser._id as any,
        reviewedAt: new Date(),
        adminNotes: updateDto.adminNotes,
        rejectionReason: updateDto.rejectionReason,
      },
      { _id: requestId },
    );

    // Get the updated request
    const updatedRequest = await this.findOne({ _id: requestId });

    // Send notification email to user
    try {
      const userDoc = await this.usersService.findOne({ _id: request.user });
      if (userDoc) {
        await this.sendMail({
          to: userDoc.email,
          subject: `Role Upgrade Request ${updateDto.status}`,
          text: `
            Your role upgrade request has been ${updateDto.status.toLowerCase()}.

            ${updateDto.adminNotes ? `Admin Notes: ${updateDto.adminNotes}` : ''}
            ${updateDto.rejectionReason ? `Rejection Reason: ${updateDto.rejectionReason}` : ''}
          `,
        });
      }
    } catch (error) {
      this.logger.warn('Failed to send status update email', error);
    }

    return updatedRequest;
  }

  async getUserRequest(userId: string) {
    return this.findOne({
      user: userId,
      status: RoleUpgradeRequestStatus.PENDING,
    });
  }

  private async sendMail(options: { to: string; subject: string; text: string }) {
    // Use the mailerService directly through dependency injection
    const mailerService = (this.mailService as any).mailerService;
    return mailerService.sendMail(options);
  }
}
