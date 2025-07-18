import { Module, forwardRef } from '@nestjs/common';

import { BookingsModule } from '../bookings/bookings.module';
import { MailService } from './services/mail.service';

@Module({
  imports: [forwardRef(() => BookingsModule)],
  providers: [MailService],
  exports: [MailService], // Export service để các module khác có thể inject
})
export class MailModule {}
