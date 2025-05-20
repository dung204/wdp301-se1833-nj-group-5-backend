import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseService } from '@/base/services';

import { Room } from '../schemas/room.schema';

@Injectable()
export class RoomsService extends BaseService<Room> {
  constructor(@InjectModel(Room.name) protected readonly model: Model<Room>) {
    const logger = new Logger(RoomsService.name);
    super(model, logger);
  }
}
