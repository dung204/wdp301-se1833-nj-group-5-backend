import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as handlebars from 'handlebars';
import { join } from 'path';

import { BookingByPaymentLinkDto } from '@/modules/bookings/dtos/booking.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {
    this.registerHandlebarsHelpers();
  }

  // Register Handlebars helpers to handle data common formatting
  // such as date formatting, currency formatting, etc.
  private registerHandlebarsHelpers(): void {
    // Helper để định dạng ngày tháng
    handlebars.registerHelper('formatDate', (date: Date) => {
      if (!date) return '';
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC', // Ensure that the date is formatted in UTC
      }).format(new Date(date));
    });

    // Helper để định dạng tiền tệ
    handlebars.registerHelper('formatCurrency', (amount: number) => {
      if (typeof amount !== 'number') return '';
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);
    });

    // Helper để tính discount amount
    handlebars.registerHelper('calculateDiscount', (originalPrice: number, finalPrice: number) => {
      return originalPrice - finalPrice;
    });

    // Helper để format payment method
    handlebars.registerHelper('formatPaymentMethod', (paymentMethod: string) => {
      const paymentMethods: Record<string, string> = {
        COD: 'Thanh toán tại khách sạn (COD)',
        PAYMENT_GATEWAY: 'Thanh toán trực tuyến',
      };
      return paymentMethods[paymentMethod] || paymentMethod;
    });

    // Helper để format cancel policy
    handlebars.registerHelper('formatCancelPolicy', (cancelPolicy: string) => {
      const policies = {
        NO_REFUND: 'Không hoàn tiền khi hủy đặt phòng',
        REFUND_BEFORE_1_DAY: 'Hoàn tiền 100% nếu hủy trước 1 ngày check-in',
        REFUND_BEFORE_3_DAYS: 'Hoàn tiền 100% nếu hủy trước 3 ngày check-in',
      };
      return policies[cancelPolicy as keyof typeof policies] || cancelPolicy;
    });

    // Helper để check payment method là COD
    handlebars.registerHelper('isCOD', (paymentMethod: string) => {
      return paymentMethod === 'COD';
    });

    // Helper để check payment method là PAYMENT_GATEWAY
    handlebars.registerHelper('isPaymentGateway', (paymentMethod: string) => {
      return paymentMethod === 'PAYMENT_GATEWAY';
    });

    // Helper để format role name
    handlebars.registerHelper('formatRole', (role: string) => {
      const roles: Record<string, string> = {
        CUSTOMER: 'Khách hàng',
        HOTEL_OWNER: 'Chủ khách sạn',
        ADMIN: 'Quản trị viên',
      };
      return roles[role] || role;
    });

    // Helper để format request type
    handlebars.registerHelper('formatRequestType', (requestType: string) => {
      const types: Record<string, string> = {
        CUSTOMER_TO_HOTEL_OWNER: 'Nâng cấp từ Khách hàng lên Chủ khách sạn',
      };
      return types[requestType] || requestType;
    });
  }

  async sendBookingConfirmationEmail(booking: BookingByPaymentLinkDto): Promise<void> {
    try {
      // Sử dụng process.cwd() để lấy root directory của project
      const templatePath = join(
        process.cwd(),
        'src',
        'modules',
        'mail',
        'templates',
        'booking-confirmation.hbs',
      );
      const templateHtml = await fs.readFile(templatePath, 'utf-8'); // read file HTML

      // handlebars.compile to compile the template
      // and pass the booking data to it
      const template = handlebars.compile(templateHtml);

      // pass object booking to the template
      let html;
      if (booking?.paymentLink?.length > 0) {
        html = template({
          ...booking,
          paymentLink: booking.paymentLink,
          currentYear: new Date().getFullYear(),
        });
      } else {
        html = template({
          ...booking,
          currentYear: new Date().getFullYear(),
        });
      }

      // Send email using MailerService
      await this.mailerService.sendMail({
        to: booking.user.email, // Lấy email từ user được populate
        subject: `[Xác nhận] Đặt phòng thành công - Mã đơn hàng ${booking.orderCode}`,
        html: html,
      });

      this.logger.log(
        `Sent booking confirmation email to ${booking.user.email} for order ${booking.orderCode}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send booking confirmation email for order ${booking.orderCode} ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async sendRoleUpgradeApprovedEmail(roleUpgradeRequest: any): Promise<void> {
    try {
      const templatePath = join(
        process.cwd(),
        'src',
        'modules',
        'mail',
        'templates',
        'role-upgrade-approved.hbs',
      );
      const templateHtml = await fs.readFile(templatePath, 'utf-8');
      const template = handlebars.compile(templateHtml);

      const html = template({
        ...roleUpgradeRequest,
        requestId: roleUpgradeRequest._id,
        currentYear: new Date().getFullYear(),
      });

      await this.mailerService.sendMail({
        to: roleUpgradeRequest.user.email,
        subject: `[Chúc mừng] Yêu cầu nâng cấp tài khoản đã được phê duyệt - ${roleUpgradeRequest.user.fullName}`,
        html: html,
      });

      this.logger.log(
        `Sent role upgrade approval email to ${roleUpgradeRequest.user.email} for request ${roleUpgradeRequest._id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send role upgrade approval email for request ${roleUpgradeRequest._id}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async sendRoleUpgradeRejectedEmail(roleUpgradeRequest: any): Promise<void> {
    try {
      const templatePath = join(
        process.cwd(),
        'src',
        'modules',
        'mail',
        'templates',
        'role-upgrade-rejected.hbs',
      );
      const templateHtml = await fs.readFile(templatePath, 'utf-8');
      const template = handlebars.compile(templateHtml);

      const html = template({
        ...roleUpgradeRequest,
        requestId: roleUpgradeRequest._id,
        currentYear: new Date().getFullYear(),
      });

      await this.mailerService.sendMail({
        to: roleUpgradeRequest.user.email,
        subject: `[Thông báo] Yêu cầu nâng cấp tài khoản - ${roleUpgradeRequest.user.fullName}`,
        html: html,
      });

      this.logger.log(
        `Sent role upgrade rejection email to ${roleUpgradeRequest.user.email} for request ${roleUpgradeRequest._id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send role upgrade rejection email for request ${roleUpgradeRequest._id}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
