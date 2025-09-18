/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TokenFilesService } from './token-files.service';

describe('TokenFilesService', () => {
  let service: TokenFilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenFilesService],
    }).compile();

    service = module.get<TokenFilesService>(TokenFilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
