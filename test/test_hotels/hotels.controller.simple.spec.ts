import { Test, TestingModule } from '@nestjs/testing';

import { HotelsController } from '@/modules/hotels/controllers/hotels.controller';
import { HotelsService } from '@/modules/hotels/services/hotels.service';

describe('HotelsController Simple', () => {
  let controller: HotelsController;
  let service: HotelsService;

  const mockHotelsService = {
    find: jest.fn(),
    createHotel: jest.fn(),
    updateHotel: jest.fn(),
    deleteHotel: jest.fn(),
    restoreHotel: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HotelsController],
      providers: [
        {
          provide: HotelsService,
          useValue: mockHotelsService,
        },
      ],
    }).compile();

    controller = module.get<HotelsController>(HotelsController);
    service = module.get<HotelsService>(HotelsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
