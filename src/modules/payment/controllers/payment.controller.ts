import { Body, Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '@/modules/auth/decorators/public.decorator';
import { TransactionsService } from '@/modules/transactions/services/transactions.service';

import { PayosService } from '../services/payment.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly payosService: PayosService,
  ) {}

  @ApiOperation({
    summary: 'Search filter bookings, get all bookings, get booking by ID',
    description: 'Search bookings with pagination, sorting and filtering options',
  })
  @Public()
  @Get('status/:orderCode')
  async checkPaymentStatus(@Param('orderCode', ParseIntPipe) orderCode: number) {
    return await this.payosService.checkPaymentStatus(orderCode);
  }

  @Get('is-paid/:orderCode')
  async isOrderPaid(@Param('orderCode', ParseIntPipe) orderCode: number) {
    const isPaid = await this.payosService.isOrderPaid(orderCode);
    return {
      orderCode,
      isPaid,
    };
  }
}
