import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
// services
import { PrismaService } from '../prisma.service';
// insterfaces
import { LogR } from './interfaces/logres.interface';
import { TIMEOPTION } from './interfaces/options.interface';
import { TimeDim } from './interfaces/timedim.interface';
import { StatsLineChart } from './interfaces/statslinechart.interface';
import { GROUPFILTER } from './interfaces/groupfilter.interface';
// prisma
import { Prisma } from '@prisma/client';
// utils
const moment = require('moment');

@Injectable()
export class LogsService {
  private amount = 30;
  constructor(private readonly prismaServ: PrismaService) {}

  @Cron(CronExpression.EVERY_10_HOURS)
  private async DeleteOldLogs() {
    const oneMonthAgo = moment().subtract(1, 'month').toDate();
    await this.prismaServ.logsReq.deleteMany({ where: { date: { lt: oneMonthAgo } } });
  }

  async createLog(entry: Prisma.LogsReqCreateInput) {
    await this.prismaServ.logsReq.create({ data: entry });
  }

  async getLogs(page: number): Promise<LogR[]> {
    const pageR = page - 1;
    const logs = await this.prismaServ.logsReq.findMany({ take: this.amount, skip: pageR * this.amount, orderBy: { date: 'desc' } });
    return logs.map((l) => ({ date: l.date.getTime(), method: l.method, route: l.route, statusCode: l.statusCode }));
  }

  async getPagesLogs(): Promise<number> {
    const count = await this.prismaServ.logsReq.count();
    return Math.ceil(count / this.amount);
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

  // contar logs segun un campo y rango de fechas

  private async countLogsByStatusCode(statusCode: string, dateFrom: Date, dateTo: Date): Promise<number> {
    return this.prismaServ.logsReq.count({ where: { statusCode: { equals: statusCode }, date: { gte: dateFrom, lte: dateTo } } });
  }

  private async countLogsByMethod(method: string, dateFrom: Date, dateTo: Date): Promise<number> {
    return this.prismaServ.logsReq.count({ where: { method: { equals: method }, date: { gte: dateFrom, lte: dateTo } } });
  }

  private async countLogsByRouteLike(route: string, dateFrom: Date, dateTo: Date): Promise<number> {
    return this.prismaServ.logsReq.count({ where: { route: { contains: route }, date: { gte: dateFrom, lte: dateTo } } });
  }

  // obtencion de sets de agrupacion

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

  private async getSetOfRoutes(from: Date, to: Date, routesLike: string[]) {
    const filteredRoutes = await Promise.all(
      routesLike.map(async (r) => {
        const numRoutes = await this.prismaServ.logsReq.count({ where: { route: { contains: r }, date: { gte: from, lte: to } } });
        numRoutes;
        if (numRoutes > 0) {
          return r;
        }
      })
    );
    return filteredRoutes.filter((r) => r !== undefined);
  }

  // Generar las line stats

  async getLineChartData(group: GROUPFILTER, time: TIMEOPTION): Promise<StatsLineChart> {
    switch (group) {
      case GROUPFILTER.METHOD:
        return this.getLineChartDataByMethod(time);
      case GROUPFILTER.ROUTE:
        return this.getLineChartDataByRouteLike(time);
      case GROUPFILTER.STATUSCODE:
        return this.getLineChartDataByStatusCode(time);
      default:
        throw new NotFoundException();
    }
  }

  private async getLineChartDataByRouteLike(time: TIMEOPTION): Promise<StatsLineChart> {
    const routes = [
      '/auth/login',
      '/auth/register',
      '/auth/password',
      '/files/tree',
      '/files/list',
      '/files/upload',
      '/files/initialize',
      '/files/write',
      '/files/zip',
      '/shared-file/tokens/list',
      '/shared-file/tokens/pages',
      '/shared-file/zip',
      '/shared-file/content',
      '/shared-file/share',
      '/shared-file/info',
      '/admin/logs',
      '/admin/memory',
      '/admin/dedicated-space',
      '/admin/used-space'
    ];
    const timedimension = this.getTimeDimension(time);
    const filteredRoutes = await this.getSetOfRoutes(timedimension[timedimension.length - 1].to, timedimension[0].from, routes);
    return Promise.all(
      filteredRoutes.map(async (m) => {
        const data = await Promise.all(
          timedimension
            .map(async (t) => {
              return { x: t.label, y: await this.countLogsByRouteLike(m, t.from, t.to) };
            })
            .reverse()
        );
        return { id: m, data };
      })
    );
  }

  private async getLineChartDataByStatusCode(time: TIMEOPTION): Promise<StatsLineChart> {
    const timedimension = this.getTimeDimension(time);
    const statusCodes = await this.getSetOfStatusCode(timedimension[timedimension.length - 1].to, timedimension[0].from);
    return Promise.all(
      statusCodes.map(async (m) => {
        const data = await Promise.all(
          timedimension
            .map(async (t) => {
              return { x: t.label, y: await this.countLogsByStatusCode(m, t.from, t.to) };
            })
            .reverse()
        );
        return { id: m, data };
      })
    );
  }

  private async getLineChartDataByMethod(time: TIMEOPTION): Promise<StatsLineChart> {
    const timedimension = this.getTimeDimension(time);
    const methods = await this.getSetOfMethods(timedimension[timedimension.length - 1].to, timedimension[0].from);
    return Promise.all(
      methods.map(async (m) => {
        const data = await Promise.all(
          timedimension
            .map(async (t) => {
              return { x: t.label, y: await this.countLogsByMethod(m, t.from, t.to) };
            })
            .reverse()
        );
        return { id: m, data };
      })
    );
  }

  // Dimension del tiempo

  private getTimeDimension(time: TIMEOPTION): TimeDim[] {
    switch (time) {
      case TIMEOPTION.TODAY:
        return this.getTimeTodayDimension();
      case TIMEOPTION.LAST7DAYS:
        return this.getTimeLast7Days();
      case TIMEOPTION.THISMONTH:
        return this.getTimeThisMonth();
      case TIMEOPTION.LAST30DAYS:
        return this.getTimeLast30Days();
      default:
        throw new NotFoundException();
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
