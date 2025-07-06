import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BookingsModule } from '../bookings/bookings.module';
import { HotelsModule } from '../hotels/hotels.module';
import { MinioStorageModule } from '../minio-storage/minio-storage.module';
import { RoomsController } from './controllers/rooms.controller';
import { Room, RoomSchema } from './schemas/room.schema';
import { RoomsService } from './services/rooms.service';

// Import HotelsModule

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
    HotelsModule,
    forwardRef(() => BookingsModule),
    MinioStorageModule,
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
