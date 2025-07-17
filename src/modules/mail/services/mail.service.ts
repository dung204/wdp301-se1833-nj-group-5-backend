import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as handlebars from 'handlebars';
import { join } from 'path';

import type { Booking } from '@/modules/bookings/schemas/booking.schema';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {
    this.registerHandlebarsHelpers();
  }

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
  }

  async sendBookingConfirmationEmail(booking: Booking): Promise<void> {
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
      const templateHtml = await fs.readFile(templatePath, 'utf-8');

      const template = handlebars.compile(templateHtml);

      const html = template({
        ...booking, // Chuyển document sang plain object
        currentYear: new Date().getFullYear(),
      });

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
        `Failed to send booking confirmation email for order ${booking.orderCode}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
