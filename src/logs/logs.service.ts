import { Injectable } from '@nestjs/common';
// services
import { PrismaService } from '../prisma.service';
// insterfaces
import { LogR } from './interfaces/logres.interface';
import { TIMEOPTION } from './interfaces/options.interface';
import { TimeDim } from './interfaces/timedim.interface';
import { StatsLineChart } from './interfaces/statslinechart.interface';
// prisma
import { Prisma } from '@prisma/client';
// utils
import { Moment } from 'moment';
const moment = require('moment');

@Injectable()
export class LogsService {
  constructor(private readonly prismaServ: PrismaService) {}

  async createLog(entry: Prisma.LogsReqCreateInput) {
    await this.prismaServ.logsReq.create({ data: entry });
  }

  async getLastDayLogs(): Promise<LogR[]> {
    const oneDayAgo = moment().subtract(1, 'day');
    const logsRaw = await this.prismaServ.logsReq.findMany({ orderBy: { date: 'desc' }, where: { date: { gte: oneDayAgo.toDate() } } });
    return logsRaw.map((l) => ({ date: l.date.getTime(), route: l.route, method: l.method, statusCode: l.statusCode }));
  }

  async getLastMonthLogs(): Promise<LogR[]> {
    const oneMonthAgo = moment().subtract(1, 'month');
    const logsRaw = await this.prismaServ.logsReq.findMany({ orderBy: { date: 'desc' }, where: { date: { gte: oneMonthAgo.toDate() } } });
    return logsRaw.map((l) => ({ date: l.date.getTime(), route: l.route, method: l.method, statusCode: l.statusCode }));
  }

  async countLogsByStatusCode(statusCode: string, dateFrom: Date, dateTo: Date): Promise<number> {
    return this.prismaServ.logsReq.count({ where: { statusCode: { equals: statusCode }, date: { gte: dateFrom, lte: dateTo } } });
  }

  async countLogsByMethod(method: string, dateFrom: Date, dateTo: Date): Promise<number> {
    return this.prismaServ.logsReq.count({ where: { method: { equals: method }, date: { gte: dateFrom, lte: dateTo } } });
  }

  async countLogsByRouteLike(route: string, dateFrom: Date, dateTo: Date): Promise<number> {
    return this.prismaServ.logsReq.count({ where: { route: { startsWith: route }, date: { gte: dateFrom, lte: dateTo } } });
  }

  private async getSetOfStatusCode(from: Date, to: Date): Promise<string[]> {
    const statusCodes = await this.prismaServ.logsReq.findMany({ select: { statusCode: true }, where: { date: { gte: from, lte: to } } });
    const procecedStatusCodes = statusCodes.map((r) => r.statusCode);
    return Array.from(new Set(procecedStatusCodes));
  }

  private async getSetOfMethods(from: Date, to: Date): Promise<string[]> {
    const methods = await this.prismaServ.logsReq.findMany({ select: { method: true }, where: { date: { gte: from, lte: to } } });
    const procecedMethods = methods.map((r) => r.method);
    return Array.from(new Set(procecedMethods));
  }

  async getLineChartDataByRouteLike(type: TIMEOPTION) {
    const routes = ['/auth/login', '/auth/login/password', '/files', '/shared-file', '/admin'];
    const timedimension = this.getTimeDimension(type);
    return Promise.all(
      routes.map(async (m) => {
        const data = await Promise.all(
          timedimension.map(async (t) => {
            return { x: t.label, y: await this.countLogsByRouteLike(m, t.from, t.to) };
          })
        );
        return { id: m, data };
      })
    );
  }

  async getLineChartDataByStatusCode(type: TIMEOPTION): Promise<StatsLineChart> {
    const timedimension = this.getTimeDimension(type);
    const statusCodes = await this.getSetOfStatusCode(timedimension[timedimension.length - 1].to, timedimension[0].from);
    return Promise.all(
      statusCodes.map(async (m) => {
        const data = await Promise.all(
          timedimension.map(async (t) => {
            return { x: t.label, y: await this.countLogsByStatusCode(m, t.from, t.to) };
          })
        );
        return { id: m, data };
      })
    );
  }

  async getLineChartDataByMethod(type: TIMEOPTION): Promise<StatsLineChart> {
    const timedimension = this.getTimeDimension(type);
    const methods = await this.getSetOfMethods(timedimension[timedimension.length - 1].to, timedimension[0].from);
    return Promise.all(
      methods.map(async (m) => {
        const data = await Promise.all(
          timedimension.map(async (t) => {
            return { x: t.label, y: await this.countLogsByMethod(m, t.from, t.to) };
          })
        );
        return { id: m, data };
      })
    );
  }

  private getTimeDimension(type: TIMEOPTION): TimeDim[] {
    switch (type) {
      case TIMEOPTION.TODAY:
        return this.getTimeTodayDimension();
      case TIMEOPTION.LAST7DAYS:
        return this.getTimeLast7Days();
      case TIMEOPTION.THISMONTH:
        return this.getTimeThisMonth();
      case TIMEOPTION.LAST30DAYS:
        return this.getTimeLast30Days();
    }
  }

  private getTimeLast30Days(): TimeDim[] {
    const iterations = [...Array(30)].map((_, i) => i);
    const dimensions = iterations.map((i) => {
      const submomento = moment().subtract(i, 'day');
      const frommomento = moment(submomento.startOf('day'));
      const tomomento = moment(submomento.endOf('day'));
      return { label: `${submomento.format('D-MMM')}`, from: frommomento.toDate(), to: tomomento.toDate() };
    });
    return dimensions;
  }

  private getTimeThisMonth(): TimeDim[] {
    const momento = moment();
    const dayofmonth = Number(momento.format('D'));
    const iterations = [...Array(dayofmonth)].map((_, i) => i);
    const dimensions: TimeDim[] = iterations.map((i) => {
      const submomento = moment().subtract(i, 'day');
      const frommomento = moment(submomento.startOf('day'));
      const tomomento = moment(submomento.endOf('day'));
      return { label: `${submomento.format('D-MMM')}`, from: frommomento.toDate(), to: tomomento.toDate() };
    });
    return dimensions;
  }

  private getTimeLast7Days(): TimeDim[] {
    const iterations = [...Array(7)].map((_, i) => i);

    const dimensions: TimeDim[] = iterations.map((i) => {
      const submomento = moment().subtract(i, 'day');
      const frommomento = moment(submomento.startOf('day'));
      const tomomento = moment(submomento.endOf('day'));
      return { label: `${submomento.format('ddd')}`, from: frommomento.toDate(), to: tomomento.toDate() };
    });
    return dimensions;
  }

  private getTimeTodayDimension(): TimeDim[] {
    const momento = moment();
    const hourDay = Number(momento.format('H'));
    const iterations = [...Array(hourDay)].map((_, i) => i);
    const dimensions: TimeDim[] = iterations.map((i) => {
      const submomento = moment().subtract(i, 'hour');
      const frommomento = moment(submomento.startOf('hour'));
      const tomomento = moment(submomento.endOf('hour'));
      return {
        label: `${frommomento.format('HH:mm')}-${tomomento.format('HH:mm')}`,
        from: frommomento.toDate(),
        to: tomomento.toDate()
      };
    });
    return dimensions;
  }
}
