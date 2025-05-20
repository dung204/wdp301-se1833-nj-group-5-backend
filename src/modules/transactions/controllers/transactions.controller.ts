import { Body, Controller, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';

import { Public } from '@/modules/auth/decorators/public.decorator';

import { MomoNotifyDto } from '../dtos/transaction.dtos';
import { TransactionsService } from '../services/transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Public()
  @ApiOperation({
    summary: 'Callback route for Momo API to notify Momo transactions',
  })
  @ApiBody({
    type: MomoNotifyDto,
    description:
      'For more details: [`https://developers.momo.vn/v3/docs/payment/api/wallet/onetime/`](https://developers.momo.vn/v3/docs/payment/api/wallet/onetime/)',
  })
  @ApiNotFoundResponse({
    description: 'Transaction not found.',
  })
  @ApiBadRequestResponse({
    description: 'The current transaction is not a Momo transaction.',
  })
  @Post('/notify/momo')
  async momoTransactionNotify(@Body() momoNotifyDto: MomoNotifyDto) {
    return this.transactionsService.handleMomoTransactionNotify(momoNotifyDto);
  }
}
