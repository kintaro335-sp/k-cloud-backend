/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { Prisma, Sharedfile } from '@prisma/client';
// interfaces
import { TokensCache, TokensCachePage } from './interfaces/token-cache.interface';
import * as dayjs from 'dayjs';

const timeTextRegex = new RegExp(/[0-9]+[h|m]/);

const numberRegex = new RegExp(/[0-9]+/);

const typeRegex = new RegExp(/[h|m]/);

@Injectable()
export class TokenFilesService implements OnModuleInit {
  private group = 64;
  constructor(
    private readonly prismaService: PrismaService,
    private configService: ConfigService
  ) {}

  private cacheExpireInType: dayjs.ManipulateType = 'hour';
  private cacheExpireInNum = 1;

  onModuleInit() {
    const expireInStr = this.configService.get<string>('TOKEN_CACHE_EXPIRE');

    if (timeTextRegex.test(expireInStr)) {
      const match = timeTextRegex.exec(expireInStr)[0];
      const number = numberRegex.exec(match)[0];
      const type = typeRegex.exec(match)[0] as dayjs.ManipulateType;
      this.cacheExpireInNum = Number(number);
      this.cacheExpireInType = type;
    }
  }

  private cacheTokens: TokensCache = {};

  private tokensPagesCache: TokensCachePage = {};

  private tokensTotalPagesCache: number | null = null;

  @Cron(CronExpression.EVERY_10_MINUTES)
  async cleanCache() {
    const today = new Date();
    const cacheTokensKeys = Object.keys(this.cacheTokens);
    cacheTokensKeys.forEach((key) => {
      const expirationDate = dayjs(this.cacheTokens[key].lastUsed).add(this.cacheExpireInNum, this.cacheExpireInType).toDate();
      if (today > expirationDate) {
        delete this.cacheTokens[key];
      }
    });

    const tokensPagesCacheKeys = Object.keys(this.tokensPagesCache);
    tokensPagesCacheKeys.forEach((key) => {
      const expirationDate = dayjs(this.tokensPagesCache[key].lastUsed).add(this.cacheExpireInNum, this.cacheExpireInType).toDate();
      if (today > expirationDate) {
        delete this.tokensPagesCache[key];
      }
    });
  }

  private invalidateAllCache() {
    this.cacheTokens = {};
    this.tokensPagesCache = {};
    this.tokensTotalPagesCache = null;
  }

  private invalidatePagesCache() {
    this.tokensPagesCache = {};
    this.tokensTotalPagesCache = null;
  }

  async addSharedFile(sharedFile: Prisma.SharedfileCreateInput) {
    if (sharedFile.public) {
      this.invalidatePagesCache();
    }
    while (true) {
      try {
        return await this.prismaService.sharedfile.create({ data: sharedFile });
      } catch (err) {}
    }
  }

  async existsTokenById(id: string) {
    while (true) {
      try {
        return (await this.prismaService.sharedfile.count({ where: { id } })) !== 0;
      } catch (err) {}
    }
  }

  async getSharedFileByID(id: string) {
    if (this.cacheTokens[id]) {
      this.cacheTokens[id].lastUsed = new Date();
      return this.cacheTokens[id].data;
    }

    while (true) {
      try {
        const tokenDB = await this.prismaService.sharedfile.findUnique({ where: { id } });
        this.cacheTokens[id] = { data: tokenDB, lastUsed: new Date() };
        return tokenDB;
      } catch (err) {}
    }
  }

  async getCountByPath(path: string): Promise<number> {
    while (true) {
      try {
        return this.prismaService.sharedfile.count({ where: { path } });
      } catch (err) {}
    }
  }

  async getSharedFiles(page: number): Promise<Sharedfile[]> {
    if (this.tokensPagesCache[page]) {
      this.tokensPagesCache[page].lastUsed = new Date();
      return this.tokensPagesCache[page].tokens;
    }

    while (true) {
      const today = new Date();
      try {
        const skip = page * this.group;
        const sharedFiles = await this.prismaService.sharedfile.findMany({
          take: this.group,
          skip,
          where: {
            OR: [
              { public: true, doesexpires: false },
              { public: true, doesexpires: true, expire: { gt: today } }
            ]
          }
        });
        this.tokensPagesCache[page] = { tokens: sharedFiles, lastUsed: new Date() };
        return sharedFiles;
      } catch (err) {}
    }
  }

  async getCountSharedPages(): Promise<number> {
    if (this.tokensTotalPagesCache !== null) {
      return this.tokensTotalPagesCache;
    }

    while (true) {
      const today = new Date();
      try {
        const count = await this.prismaService.sharedfile.count({
          where: {
            OR: [
              { public: true, doesexpires: false },
              { public: true, doesexpires: true, expire: { gt: today } }
            ]
          }
        });
        const pages = Math.ceil(count / this.group);
        this.tokensTotalPagesCache = pages;
        return pages;
      } catch (err) {}
    }
  }

  async getSharedFilesByPathUserID(path: string, userid: string): Promise<Sharedfile[]> {
    while (true) {
      try {
        return this.prismaService.sharedfile.findMany({ where: { path, userid } });
      } catch (err) {}
    }
  }

  async removeSharedFile(id: string) {
    this.invalidateAllCache();
    while (true) {
      try {
        return this.prismaService.sharedfile.delete({ where: { id } });
      } catch (err) {
        if (err.code === 'P2025') {
          return;
        }
      }
    }
  }

  async deleteTokensByPath(path: string, userid: string) {
    this.invalidateAllCache();
    while (true) {
      try {
        await this.prismaService.sharedfile.deleteMany({ where: { path, userid } });
        return;
      } catch (err) {}
    }
  }

  async updateSF(id: string, newData: Prisma.SharedfileUpdateInput) {
    this.invalidateAllCache();
    while (true) {
      try {
        return await this.prismaService.sharedfile.update({ where: { id }, data: newData });
      } catch (err) {}
    }
  }

  async updatePathTokens(oldpath: string, newPath: string) {
    this.invalidateAllCache();
    await this.prismaService.sharedfile.updateMany({ data: { path: newPath }, where: { path: oldpath } });
    const tokens = await this.prismaService.sharedfile.findMany({ where: { path: { startsWith: oldpath } } });
    tokens.forEach(async (t) => {
      const newPathT = t.path.replace(oldpath, newPath);
      while (true) {
        try {
          await this.prismaService.sharedfile.update({ data: { path: newPathT }, where: { id: t.id } });
          break;
        } catch (err) {}
      }
    });
  }

  async getTokensByUser(userid: string, page: number) {
    while (true) {
      try {
        const skip = page * this.group;
        return this.prismaService.sharedfile.findMany({ skip, take: this.group, where: { userid } });
      } catch (err) {}
    }
  }

  async getPagesNumberByUser(userid: string): Promise<number> {
    while (true) {
      try {
        const count = await this.prismaService.sharedfile.count({ where: { userid } });
        return Math.ceil(count / this.group);
      } catch (err) {}
    }
  }
}
