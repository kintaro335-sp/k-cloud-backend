import { Injectable } from '@nestjs/common';
// services
import { PrismaService } from '../prisma.service';
// prisma
import { Prisma } from '@prisma/client';
// utils
import moment from 'moment';

@Injectable()
export class LogsService {
  constructor(private readonly prismaServ: PrismaService) {}

  async createLog(entry: Prisma.LogsReqCreateInput) {
    await this.prismaServ.logsReq.create({ data: entry });
  }

  async getLastDayLogs() {
    const oneDayAgo = moment().subtract(1, 'day');
    return this.prismaServ.logsReq.findMany({ orderBy: { date: 'desc' }, where: { date: { gte: oneDayAgo.toDate() } } });
  }

  async getLastMonthLogs() {
    const oneMonthAgo = moment().subtract(1, 'month');
    return this.prismaServ.logsReq.findMany({ orderBy: { date: 'desc' }, where: { date: { gte: oneMonthAgo.toDate() } } });
  }
}
