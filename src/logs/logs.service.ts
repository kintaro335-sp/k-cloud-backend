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
import moment from 'moment';

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

  async countLogsByMethod(method: string, dateFrom: Date, dateTo: Date): Promise<number> {
    return this.prismaServ.logsReq.count({ where: { method: { equals: method }, AND: { date: { gte: dateFrom, lte: dateTo } } } });
  }

  async getLineChartDataByMethod(type: TIMEOPTION): Promise<StatsLineChart> {
    const timedimension = this.getTimeDimension(type);
    const methods = Array.from(new Set((await this.getLastDayLogs()).map((l) => l.method)));
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

  private getTimeDimension(type: TIMEOPTION) {
    switch (type) {
      case TIMEOPTION.TODAY:
        return this.getTimeTodayDimension();
    }
  }

  private getTimeTodayDimension() {
    const momento = moment();
    const hourDay = Number(momento.format('H'));
    const iterations = [...Array(hourDay)].map((_, i) => i);
    const dimensions: TimeDim[] = iterations.map((i) => {
      const submomento = momento.subtract(i, 'hour');
      const frommomento = submomento.startOf('hour');
      const tomomento = submomento.endOf('hour');
      return {
        label: `${frommomento.format('HH-mm')}-${tomomento.format('HH-mm')}`,
        from: frommomento.toDate(),
        to: tomomento.toDate()
      };
    });
    return dimensions;
  }
}
