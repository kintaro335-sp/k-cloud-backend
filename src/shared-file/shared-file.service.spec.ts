/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SharedFileService } from './shared-file.service';

describe('SharedFileService', () => {
  let service: SharedFileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharedFileService],
    }).compile();

    service = module.get<SharedFileService>(SharedFileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
