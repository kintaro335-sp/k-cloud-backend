/*
 * k-cloud-backend
 * Copyright(c) Kintaro Ponce
 * MIT Licensed
 */

import { ApiProperty } from '@nestjs/swagger';

class DataLineChart {
  @ApiProperty({ type: String })
  x: string;
  @ApiProperty({ type: Number })
  y: number;
}

export class SerieLineChartResp {
  @ApiProperty({ type: String })
  id: string;
  @ApiProperty({ type: DataLineChart })
  data: DataLineChart[];
}




