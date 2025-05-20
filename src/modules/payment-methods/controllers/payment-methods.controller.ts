import { Controller } from '@nestjs/common';

import { PaymentMethodsService } from '../services/payment-methods.service';

@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}
}
