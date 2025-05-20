import { Controller } from '@nestjs/common';

import { DiscountsService } from '../services/discounts.service';

@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}
}
