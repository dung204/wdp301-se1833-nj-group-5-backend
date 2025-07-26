import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MailModule } from '@/modules/mail/mail.module';
import { UsersModule } from '@/modules/users/users.module';

import { RoleUpgradeRequestsController } from './controllers/role-upgrade-requests.controller';
import {
  RoleUpgradeRequest,
  RoleUpgradeRequestSchema,
} from './schemas/role-upgrade-request.schema';
import { RoleUpgradeRequestsService } from './services/role-upgrade-requests.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RoleUpgradeRequest.name, schema: RoleUpgradeRequestSchema },
    ]),
    UsersModule,
    MailModule,
  ],
  controllers: [RoleUpgradeRequestsController],
  providers: [RoleUpgradeRequestsService],
  exports: [RoleUpgradeRequestsService],
})
export class RoleUpgradeRequestsModule {}
