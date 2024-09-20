/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SharedFileController } from './shared-file.controller';

describe('SharedFileController', () => {
  let controller: SharedFileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SharedFileController],
    }).compile();

    controller = module.get<SharedFileController>(SharedFileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
