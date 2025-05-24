import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { HotelsModule } from '../hotels/hotels.module';
import { RoomsController } from './controllers/rooms.controller';
import { Room, RoomSchema } from './schemas/room.schema';
import { RoomsService } from './services/rooms.service';

// Import HotelsModule

@Module({
  imports: [MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]), HotelsModule],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
