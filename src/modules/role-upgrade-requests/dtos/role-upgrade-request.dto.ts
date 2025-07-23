import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

import { SwaggerExamples } from '@/base/constants';
import { SchemaResponseDto } from '@/base/dtos';
import { Role } from '@/modules/auth/enums/role.enum';
import { UserProfileDto } from '@/modules/users/dtos/user.dtos';

import { RequestType, RoleUpgradeRequestStatus } from '../enums/role-upgrade-request.enum';

export class CreateRoleUpgradeRequestDto {
  @ApiProperty({
    description: 'Type of role upgrade request',
    enum: RequestType,
    enumName: 'RequestType',
    example: RequestType.CUSTOMER_TO_HOTEL_OWNER,
  })
  @IsEnum(RequestType, {
    message: 'Request type must be a valid type',
  })
  requestType!: RequestType;

  @ApiProperty({
    description: 'Target role to upgrade to',
    enum: [Role.HOTEL_OWNER],
    enumName: 'TargetRole',
    example: Role.HOTEL_OWNER,
  })
  @IsEnum([Role.HOTEL_OWNER], {
    message: 'Only upgrade to HOTEL_OWNER role is supported',
  })
  targetRole!: Role.HOTEL_OWNER;

  @ApiProperty({
    description: 'Contact information (phone number, email, etc.)',
    example: '+84 123 456 789 or contact@example.com',
    minLength: 10,
  })
  @IsString()
  @MinLength(10, {
    message: 'Contact information must be at least 10 characters long',
  })
  contactInfo!: string;

  @ApiProperty({
    description: 'Reason for requesting role upgrade',
    example: 'I own a hotel and want to manage it through this platform',
    minLength: 20,
  })
  @IsString()
  @MinLength(20, {
    message: 'Reason must be at least 20 characters long',
  })
  reason!: string;
}

export class UpdateRoleUpgradeRequestDto {
  @ApiProperty({
    description: 'New status for the request',
    enum: RoleUpgradeRequestStatus,
    enumName: 'RoleUpgradeRequestStatus',
    example: RoleUpgradeRequestStatus.APPROVED,
  })
  @IsEnum(RoleUpgradeRequestStatus, {
    message: 'Status must be a valid status',
  })
  status!: RoleUpgradeRequestStatus;

  @ApiProperty({
    description: 'Admin notes about the request',
    example: 'Verified hotel ownership documents',
    required: false,
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiProperty({
    description: 'Reason for rejection (required if status is REJECTED)',
    example: 'Unable to verify hotel ownership',
    required: false,
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

@Exclude()
export class RoleUpgradeRequestResponseDto extends SchemaResponseDto {
  @Expose()
  @ApiProperty({
    description: 'User who made the request',
    type: UserProfileDto,
  })
  user!: UserProfileDto;

  @Expose()
  @ApiProperty({
    description: 'Type of role upgrade request',
    enum: RequestType,
    enumName: 'RequestType',
    example: RequestType.CUSTOMER_TO_HOTEL_OWNER,
  })
  requestType!: RequestType;

  @Expose()
  @ApiProperty({
    description: 'Current role of the user',
    enum: Role,
    enumName: 'CurrentRole',
    example: Role.CUSTOMER,
  })
  currentRole!: Role;

  @Expose()
  @ApiProperty({
    description: 'Target role to upgrade to',
    enum: Role,
    enumName: 'TargetRole',
    example: Role.HOTEL_OWNER,
  })
  targetRole!: Role;

  @Expose()
  @ApiProperty({
    description: 'Contact information provided by user',
    example: '+84 123 456 789',
  })
  contactInfo!: string;

  @Expose()
  @ApiProperty({
    description: 'Reason provided by user',
    example: 'I own a hotel and want to manage it through this platform',
  })
  reason!: string;

  @Expose()
  @ApiProperty({
    description: 'Current status of the request',
    enum: RoleUpgradeRequestStatus,
    enumName: 'RoleUpgradeRequestStatus',
    example: RoleUpgradeRequestStatus.PENDING,
  })
  status!: RoleUpgradeRequestStatus;

  @Expose()
  @ApiProperty({
    description: 'Admin who reviewed the request',
    type: UserProfileDto,
    required: false,
  })
  reviewedBy?: UserProfileDto;

  @Expose()
  @ApiProperty({
    description: 'Date when the request was reviewed',
    example: SwaggerExamples.DATE_FROM,
    required: false,
  })
  reviewedAt?: Date;

  @Expose()
  @ApiProperty({
    description: 'Admin notes about the request',
    example: 'Verified hotel ownership documents',
    required: false,
  })
  adminNotes?: string;

  @Expose()
  @ApiProperty({
    description: 'Reason for rejection',
    example: 'Unable to verify hotel ownership',
    required: false,
  })
  rejectionReason?: string;
}

export class TestRoleUpgradeEmailDto {
  @ApiProperty({
    description: 'Role upgrade request ID to send test email for',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  requestId!: string;

  @ApiProperty({
    description: 'Type of email to send',
    enum: ['approved', 'rejected'],
    example: 'approved',
  })
  @IsEnum(['approved', 'rejected'], {
    message: 'Email type must be either approved or rejected',
  })
  emailType!: 'approved' | 'rejected';
}
