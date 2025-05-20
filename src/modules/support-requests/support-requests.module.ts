import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SupportRequestsController } from './controllers/support-requests.controller';
import { SupportRequest, SupportRequestSchema } from './schemas/support-request.schema';
import { SupportRequestsService } from './services/support-requests.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SupportRequest.name, schema: SupportRequestSchema }]),
  ],
  controllers: [SupportRequestsController],
  providers: [SupportRequestsService],
  exports: [SupportRequestsService],
})
export class SupportRequestsModule {}
