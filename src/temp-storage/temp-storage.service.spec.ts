import { Test, TestingModule } from '@nestjs/testing';
import { TempStorageService } from './temp-storage.service';

describe('TempStorageService', () => {
  let service: TempStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TempStorageService],
    }).compile();

    service = module.get<TempStorageService>(TempStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
