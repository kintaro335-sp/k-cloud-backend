import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
// interfaces
import { MemoryUsageInfo } from './interfaces/MemoryUsageInfo.interface';
import { StatsLineChart } from '../logs/interfaces/statslinechart.interface';

@Injectable()
export class MonitorService {
  private memoryInfo: Array<MemoryUsageInfo> = [];

  @Interval(1000)
  registerMemoryUsage() {
    const memUsage = process.memoryUsage();
    this.memoryInfo.push({ rss: memUsage.rss, buffer: memUsage.arrayBuffers });
    if (this.memoryInfo.length > 60) {
      this.memoryInfo.shift();
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
}
