export type StatsLineChart = SerieLineChart[];

export interface SerieLineChart {
  id: string;
  data: DataLineChart[];
}

export interface DataLineChart {
  x: string;
  y: number;
}
