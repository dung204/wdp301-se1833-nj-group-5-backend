import { Controller } from '@nestjs/common';

import { SupportRequestsService } from '../services/support-requests.service';

@Controller('support-requests')
export class SupportRequestsController {
  constructor(private readonly SupportRequestsService: SupportRequestsService) {}
}
