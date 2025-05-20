import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHmac } from 'crypto';
import { Model } from 'mongoose';

import { configs } from '@/base/configs';
import { RedisService } from '@/base/database';
import { BaseService } from '@/base/services';
import { User } from '@/modules/users/schemas/user.schema';

import { MomoNotifyDto } from '../dtos/transaction.dtos';
import { Transaction } from '../schemas/transaction.schema';

@Injectable()
export class TransactionsService extends BaseService<Transaction> {
  private readonly MOMO_RESULT_CODE_SUCCESS = 0;

  constructor(
    @InjectModel(Transaction.name) protected readonly model: Model<Transaction>,
    private readonly httpService: HttpService,
    private readonly redisService: RedisService,
  ) {
    const logger = new Logger(TransactionsService.name);
    super(model, logger);
  }

  async handleMomoTransactionNotify(momoNotifyDto: MomoNotifyDto) {
    const { resultCode, orderId: transactionId } = momoNotifyDto;
    const transactionStr = await this.redisService.get(transactionId);
    if (!transactionStr) throw new NotFoundException('Transaction not found');

    const transaction: Transaction = JSON.parse(transactionStr);

    // TODO: If payment method is not Momo => return a 400 Bad Request

    await this.redisService.del(transactionId);
    if (resultCode === this.MOMO_RESULT_CODE_SUCCESS) {
      await this.createOne('', transaction);
    }
  }

  private async generateMomoPurchaseUrl(
    transactionId: string,
    user: User,
    amount: number,
    redirectUrl: string,
    additionalData?: Record<string, unknown>,
  ) {
    const momoConfig = configs.MOMO;
    const requestId = transactionId;
    const orderId = requestId;
    const orderInfo = 'Test transaction';
    const extraData = !additionalData
      ? ''
      : Buffer.from(JSON.stringify(additionalData)).toString('base64');

    const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${momoConfig.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${momoConfig.requestType}`;
    const signature = createHmac('sha256', momoConfig.secretKey).update(rawSignature).digest('hex');

    const requestBody = JSON.stringify({
      ...momoConfig,
      requestId,
      orderId,
      orderInfo,
      extraData,
      signature,
    });

    const res = await this.httpService.axiosRef.post(
      'https://test-payment.momo.vn/v2/gateway/api/create',
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody),
        },
      },
    );

    const { payUrl } = res.data;
    return payUrl as string;
  }
}
