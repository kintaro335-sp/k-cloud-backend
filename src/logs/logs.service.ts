/*
 * k-cloud-backend
 * Copyright(c) 2022 Kintaro Ponce
 * MIT Licensed
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
// services
import { PrismaService } from '../prisma.service';
import { SystemService } from '../system/system.service';
// insterfaces
import { SharedFileActivity } from './interfaces/sharedfileActivity.interface';
import { TIMEOPTION } from './interfaces/options.interface';
import { TimeDim } from './interfaces/timedim.interface';
import { StatsLineChart } from './interfaces/statslinechart.interface';
import { GROUPFILTER } from './interfaces/groupfilter.interface';
// prisma
import { Prisma } from '@prisma/client';
// utils
import * as dayjs from 'dayjs';

@Injectable()
export class LogsService {
  private amount = 30;
  constructor(private readonly prismaServ: PrismaService, private system: SystemService) {}

  @Cron(CronExpression.EVERY_10_HOURS)
  private async DeleteOldLogs() {
    const oneMonthAgo = dayjs().subtract(1, 'month').toDate();
    await this.prismaServ.sharedfilesactivity.deleteMany({ where: { date: { lt: oneMonthAgo } } });
  }

  async createLog(entry: SharedFileActivity) {
    while (true) {
      try {
        const data = await this.prismaServ.sharedfilesactivity.create({ data: entry });
        return data;
      } catch (err) {}
    }
  }

  async getLogs(page: number): Promise<SharedFileActivity[]> {
    const pageR = page - 1;
    const logs = await this.prismaServ.sharedfilesactivity.findMany({ take: this.amount, skip: pageR * this.amount, orderBy: { date: 'desc' } });
    // @ts-ignore
    return logs;
  }

  async getPagesLogs(): Promise<number> {
    const count = await this.prismaServ.sharedfilesactivity.count();
    return Math.ceil(count / this.amount);
  }

  // contar logs segun un campo y rango de fechas

  private async countLogsByStatus(statusCode: string, dateFrom: Date, dateTo: Date): Promise<number> {
    return this.prismaServ.sharedfilesactivity.count({ where: { status: { equals: statusCode }, date: { gte: dateFrom, lte: dateTo } } });
  }

  private async countLogsByAction(action: string, dateFrom: Date, dateTo: Date): Promise<number> {
    return this.prismaServ.sharedfilesactivity.count({ where: { action: { equals: action }, date: { gte: dateFrom, lte: dateTo } } });
  }

  private async countLogsByReason(route: string, dateFrom: Date, dateTo: Date): Promise<number> {
    return this.prismaServ.sharedfilesactivity.count({ where: { reason: { contains: route }, date: { gte: dateFrom, lte: dateTo } } });
  }

  // Generar las line stats

  async getLineChartData(group: GROUPFILTER, time: TIMEOPTION): Promise<StatsLineChart> {
    switch (group) {
      case GROUPFILTER.ACTION:
        return this.getLineChartDataByAction(time);
      case GROUPFILTER.REASON:
        return this.getLineChartDataByReason(time);
      case GROUPFILTER.STATUS:
        return this.getLineChartDataByStatus(time);
      default:
        throw new NotFoundException();
    }
  }

  private async getLineChartDataByReason(time: TIMEOPTION): Promise<StatsLineChart> {
    const timedimension = this.getTimeDimension(time);
    const filteredRoutes = ['NOT_EXIST', 'EXPIRED', 'WRONG_OWNER', 'NONE'];
    return Promise.all(
      filteredRoutes.map(async (m) => {
        const data = await Promise.all(
          timedimension
            .map(async (t) => {
              return { x: t.label, y: await this.countLogsByReason(m, t.from, t.to) };
            })
            .reverse()
        );
        return { id: m, data };
      })
    );
  }

  private async getLineChartDataByStatus(time: TIMEOPTION): Promise<StatsLineChart> {
    const timedimension = this.getTimeDimension(time);
    const statusCodes = ['DENIED', 'ALLOWED'];
    return Promise.all(
      statusCodes.map(async (m) => {
        const data = await Promise.all(
          timedimension
            .map(async (t) => {
              return { x: t.label, y: await this.countLogsByStatus(m, t.from, t.to) };
            })
            .reverse()
        );
        return { id: m, data };
      })
    );
  }

  private async getLineChartDataByAction(time: TIMEOPTION): Promise<StatsLineChart> {
    const timedimension = this.getTimeDimension(time);
    const Actions = ['CREATED', 'READ', 'DOWNLOAD', 'DELETE', 'DOWNLOAD_ZIP', 'MODIFY'];
    return Promise.all(
      Actions.map(async (m) => {
        const data = await Promise.all(
          timedimension
            .map(async (t) => {
              return { x: t.label, y: await this.countLogsByAction(m, t.from, t.to) };
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
      const submomento = dayjs().subtract(i, 'day');
      const frommomento = dayjs(submomento.startOf('day'));
      const tomomento = dayjs(submomento.endOf('day'));
      return { label: `${submomento.format('D-MMM')}`, from: frommomento.toDate(), to: tomomento.toDate() };
    });
    return dimensions;
  }

  private getTimeThisMonth(): TimeDim[] {
    const momento = dayjs();
    const dayofmonth = Number(momento.format('D'));
    const iterations = [...Array(dayofmonth)].map((_, i) => i);
    const dimensions: TimeDim[] = iterations.map((i) => {
      const submomento = dayjs().subtract(i, 'day');
      const frommomento = dayjs(submomento.startOf('day'));
      const tomomento = dayjs(submomento.endOf('day'));
      return { label: `${submomento.format('D-MMM')}`, from: frommomento.toDate(), to: tomomento.toDate() };
    });
    return dimensions;
  }

  private getTimeLast7Days(): TimeDim[] {
    const iterations = [...Array(7)].map((_, i) => i);

    const dimensions: TimeDim[] = iterations.map((i) => {
      const submomento = dayjs().subtract(i, 'day');
      const frommomento = dayjs(submomento.startOf('day'));
      const tomomento = dayjs(submomento.endOf('day'));
      return { label: `${submomento.format('ddd')}`, from: frommomento.toDate(), to: tomomento.toDate() };
    });
    return dimensions;
  }

  private getTimeTodayDimension(): TimeDim[] {
    const dayjsM = dayjs();
    const hourDay = Number(dayjsM.format('H')) + 1;
    const iterations = [...Array(hourDay)].map((_, i) => i);
    const dimensions: TimeDim[] = iterations.map((i) => {
      const submomento = dayjs().subtract(i, 'hour');
      const frommomento = dayjs(submomento.startOf('hour'));
      const tomomento = dayjs(submomento.endOf('hour'));
      return {
        label: `${frommomento.format('HH:mm')}-${tomomento.format('HH:mm')}`,
        from: frommomento.toDate(),
        to: tomomento.toDate()
      };
    });
    return dimensions;
  }
}
