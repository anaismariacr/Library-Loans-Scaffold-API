import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { ItemsService } from './items.service';
import { Loan } from '../loans/entities/loan.entity';

describe('ItemsService', () => {
  let service: ItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        {
          provide: getRepositoryToken(Item),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
            findOneBy: jest.fn(),
            remove: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Loan),
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
