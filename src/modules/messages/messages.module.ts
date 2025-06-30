import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BookingsModule } from '../bookings/bookings.module';
import { HotelsModule } from '../hotels/hotels.module';
import { MessagesController } from './controllers';
import { Message, MessageSchema } from './schemas';
import { MessagesService } from './services';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    BookingsModule,
    HotelsModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
