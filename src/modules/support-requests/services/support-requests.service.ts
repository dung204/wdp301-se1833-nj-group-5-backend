import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseService } from '@/base/services';

import { SupportRequest } from '../schemas/support-request.schema';

@Injectable()
export class SupportRequestsService extends BaseService<SupportRequest> {
  constructor(@InjectModel(SupportRequest.name) protected readonly model: Model<SupportRequest>) {
    const logger = new Logger(SupportRequestsService.name);
    super(model, logger);
  }
}
