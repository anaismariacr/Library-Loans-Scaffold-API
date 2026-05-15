// src/modules/loans/loans.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { LoansService } from './loans.service';
import { Loan, LoanStatus } from './entities/loan.entity';
import { Item } from '../items/entities/item.entity';
import { User } from '../auth/entities/user.entity';

const makeUser = (overrides = {}): User =>
  ({ id: 'user-1', email: 'a@b.com', isActive: true, ...overrides }) as User;

const makeItem = (overrides = {}): Item =>
  ({ id: 'item-1', title: 'Clean Code', isActive: true, ...overrides }) as Item;

const makeLoan = (overrides = {}): Loan => {
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + 7);
  return {
    id: 'loan-1',
    userId: 'user-1',
    itemId: 'item-1',
    status: LoanStatus.ACTIVE,
    loanedAt: new Date(),
    dueAt,
    returnedAt: null,
    fineAmount: 0,
    ...overrides,
  } as Loan;
};

const buildManagerMock = (repos: {
  loanRepo?: Partial<Repository<Loan>>;
  itemRepo?: Partial<Repository<Item>>;
  userRepo?: Partial<Repository<User>>;
}) => ({
  getRepository: jest.fn((entity) => {
    if (entity === Loan) return repos.loanRepo;
    if (entity === Item) return repos.itemRepo;
    if (entity === User) return repos.userRepo;
  }),
});

describe('LoansService', () => {
  let service: LoansService;

  const loanRepoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    })),
    manager: { transaction: jest.fn() },
  };

  const itemRepoMock = { findOne: jest.fn(), findOneBy: jest.fn() };
  const userRepoMock = { findOneBy: jest.fn() };

  const configServiceMock = {
    get: jest.fn((key: string) => {
      const map: Record<string, unknown> = {
        'loans.maxActivePerUser': 3,
        'loans.dailyFineRate': 0.5,
        'loans.maxLoanDays': 30,
      };
      return map[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoansService,
        { provide: getRepositoryToken(Loan), useValue: loanRepoMock },
        { provide: getRepositoryToken(Item), useValue: itemRepoMock },
        { provide: getRepositoryToken(User), useValue: userRepoMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<LoansService>(LoansService);
  });

  //Test 1

  it('Crea préstamo exitoso cuando item disponible, usuario bajo el límite y fechas válidas', async () => {
    const user = makeUser();
    const item = makeItem();
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + 7);

    const dto = { userId: user.id, itemId: item.id, dueAt: dueAt.toISOString() };

    const txLoanRepo = {
      findOne: jest.fn().mockResolvedValue(null), // no active loan for item
      count: jest.fn().mockResolvedValue(0), // 0 active loans for user
      create: jest.fn().mockReturnValue(makeLoan()),
      save: jest.fn().mockImplementation((l) => Promise.resolve({ ...l, id: 'loan-new' })),
    };
    const txItemRepo = { findOne: jest.fn().mockResolvedValue(item) };
    const txUserRepo = { findOneBy: jest.fn().mockResolvedValue(user) };

    loanRepoMock.manager.transaction.mockImplementation((cb: (m: EntityManager) => Promise<Loan>) =>
      cb(
        buildManagerMock({
          loanRepo: txLoanRepo,
          itemRepo: txItemRepo,
          userRepo: txUserRepo,
        }) as unknown as EntityManager,
      ),
    );

    const result = await service.create(dto);

    expect(txUserRepo.findOneBy).toHaveBeenCalledWith({ id: user.id });
    expect(txItemRepo.findOne).toHaveBeenCalledWith({ where: { id: item.id } });
    expect(txLoanRepo.count).toHaveBeenCalled();
    expect(txLoanRepo.save).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  //Test 2

  it('Lanza ConflictException si el item ya tiene un préstamo activo (R2).', async () => {
    const user = makeUser();
    const item = makeItem();
    const existingLoan = makeLoan({ id: 'blocking-loan' });
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + 7);

    const dto = { userId: user.id, itemId: item.id, dueAt: dueAt.toISOString() };

    const txLoanRepo = {
      findOne: jest.fn().mockResolvedValue(existingLoan), // item is blocked
      count: jest.fn().mockResolvedValue(0),
    };
    const txItemRepo = { findOne: jest.fn().mockResolvedValue(item) };
    const txUserRepo = { findOneBy: jest.fn().mockResolvedValue(user) };

    loanRepoMock.manager.transaction.mockImplementation((cb: (m: EntityManager) => Promise<Loan>) =>
      cb(
        buildManagerMock({
          loanRepo: txLoanRepo,
          itemRepo: txItemRepo,
          userRepo: txUserRepo,
        }) as unknown as EntityManager,
      ),
    );

    await expect(service.create(dto)).rejects.toThrow(ConflictException);
    await expect(service.create(dto)).rejects.toThrow('blocking-loan');
  });

  //Test 3

  it('Lanza ConflictException si el usuario ya tiene 3 préstamos activos (R3).', async () => {
    const user = makeUser();
    const item = makeItem();
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + 7);

    const dto = { userId: user.id, itemId: item.id, dueAt: dueAt.toISOString() };

    const txLoanRepo = {
      findOne: jest.fn().mockResolvedValue(null), // item is free
      count: jest.fn().mockResolvedValue(3), // user is at the limit
    };
    const txItemRepo = { findOne: jest.fn().mockResolvedValue(item) };
    const txUserRepo = { findOneBy: jest.fn().mockResolvedValue(user) };

    loanRepoMock.manager.transaction.mockImplementation((cb: (m: EntityManager) => Promise<Loan>) =>
      cb(
        buildManagerMock({
          loanRepo: txLoanRepo,
          itemRepo: txItemRepo,
          userRepo: txUserRepo,
        }) as unknown as EntityManager,
      ),
    );

    await expect(service.create(dto)).rejects.toThrow(ConflictException);
    await expect(service.create(dto)).rejects.toThrow('3');
  });

  //Test 4

  it('return calcula multa correctamente', async () => {
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() - 5); // 5 days ago

    const loan = makeLoan({ status: LoanStatus.ACTIVE, dueAt });

    const txLoanRepo = {
      findOne: jest.fn().mockResolvedValue(loan),
      save: jest.fn().mockImplementation((l) => Promise.resolve(l)),
    };

    loanRepoMock.manager.transaction.mockImplementation((cb: (m: EntityManager) => Promise<Loan>) =>
      cb(buildManagerMock({ loanRepo: txLoanRepo }) as unknown as EntityManager),
    );

    const result = await service.returnLoan(loan.id);

    expect(result.status).toBe(LoanStatus.RETURNED);
    expect(result.returnedAt).toBeDefined();
    expect(result.fineAmount).toBe(2.5);
  });
});
