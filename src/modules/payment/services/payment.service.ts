import { HttpService } from '@nestjs/axios';
import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

// Dùng axios hoặc http module của NestJS
import { configs } from '@/base/configs';
import { Booking } from '@/modules/bookings/schemas/booking.schema';

@Injectable()
export class PayosService {
  private readonly PAYOS_CLIENT_ID = configs.PAYOS.clientId;
  private readonly PAYOS_API_KEY = configs.PAYOS.apiKey;
  private readonly PAYOS_CHECKSUM_KEY = configs.PAYOS.checksumKey;
  private readonly PAYOS_API_URL = configs.PAYOS.apiUrl;

  constructor(private readonly httpService: HttpService) {
    const logger = new Logger(PayosService.name);
    logger.log('PayosService initialized with API URL: ' + this.PAYOS_API_URL);
  }

  // Hàm tạo checksum
  private createChecksum(data: string): string {
    return crypto.createHmac('sha256', this.PAYOS_CHECKSUM_KEY).update(data).digest('hex');
  }

  async createPaymentLink(booking: Booking) {
    try {
      const orderCode = booking.orderCode;

      const paymentData = {
        orderCode: orderCode,
        amount: booking.totalPrice,
        description: `${orderCode}`,
        returnUrl: `${process.env.FRONTEND_URL}/payment/success`,
        cancelUrl: `${process.env.FRONTEND_URL}/payment/failed`,
      };

      // Tạo chuỗi để tạo checksum theo quy định của PayOS
      const dataToSign = `amount=${paymentData.amount}&cancelUrl=${paymentData.cancelUrl}&description=${paymentData.description}&orderCode=${paymentData.orderCode}&returnUrl=${paymentData.returnUrl}`;
      const signature = this.createChecksum(dataToSign);

      const response = await this.httpService.axiosRef.post(
        this.PAYOS_API_URL,
        { ...paymentData, signature },
        {
          headers: {
            'x-client-id': this.PAYOS_CLIENT_ID,
            'x-api-key': this.PAYOS_API_KEY,
          },
        },
      );

      if (!response.data || !response.data.data) {
        throw new BadGatewayException('Invalid response from PayOS');
      }

      // response.data sẽ chứa checkoutUrl
      return response.data.data;
    } catch (error) {
      throw new BadGatewayException(
        `Failed to create payment link with PayOS ${
          error instanceof Error ? error.message : 'Error in createPaymentLink'
        }`,
      );
    }
  }
}
