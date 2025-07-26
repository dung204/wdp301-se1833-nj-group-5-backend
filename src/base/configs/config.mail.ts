import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailerAsyncOptions } from '@nestjs-modules/mailer/dist/interfaces/mailer-async-options.interface';
import { join } from 'path';

import { ConfigModule } from './config.module';
import { ConfigService } from './config.service';

export const mailConfig: MailerAsyncOptions = {
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    transport: {
      host: configService.MAIL.host,
      secure: configService.MAIL.secure,
      port: configService.MAIL.port,
      auth: {
        user: configService.MAIL.auth.user,
        pass: configService.MAIL.auth.pass,
      },
    },
    defaults: {
      from: configService.MAIL.from,
    },
    template: {
      dir: join(__dirname, '../../modules/mail/templates'),
      adapter: new HandlebarsAdapter(),
      options: {
        strict: true,
      },
    },
  }),
  inject: [ConfigService],
};
