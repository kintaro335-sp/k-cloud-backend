/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
// interfaces
import { MemoryUsageInfo } from './interfaces/MemoryUsageInfo.interface';
import { StatsLineChart } from '../logs/interfaces/statslinechart.interface';
// services
import { SystemService } from '../system/system.service';
import { loadavg, cpus } from 'node:os';

@Injectable()
export class MonitorService {
  constructor(private system: SystemService) {}
  private memoryInfo: Array<MemoryUsageInfo> = [...Array(59)].map(() => ({ rss: 0, buffer: 0 }));
  private interval = 3;
  private sec = 0;

  @Interval(1000)
  registerMemoryUsage() {
    const memUsage = process.memoryUsage();
    this.memoryInfo.push({ rss: memUsage.rss, buffer: memUsage.arrayBuffers });
    if (this.memoryInfo.length > 60) {
      this.memoryInfo.shift();
    }
    this.sec++;
    if (this.sec > this.interval) {
      this.system.emitChangeMemoryMonitorEvent();
      this.sec = 0;
    }
  }

  getLineChartdataMemoryUsage(): StatsLineChart {
    return [
      {
        id: 'rss',
        data: this.memoryInfo.map((val, i) => ({ y: val.rss, x: String(i + 1) }))
      },
      {
        id: 'buffer',
        data: this.memoryInfo.map((val, i) => ({ y: val.buffer, x: String(i + 1) }))
      }
    ];
  }

  getCPUUsage(): number {
    const load = loadavg();
    return load[0] / cpus().length;
  }
}
