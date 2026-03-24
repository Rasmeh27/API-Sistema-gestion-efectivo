// modules/kpis/kpis.repository.ts

import {
  KpiSnapshotRecord,
  CreateKpiSnapshotDto,
  ListKpiSnapshotsQuery,
  CashSummary,
  TransactionVolume,
  BalanceAlert,
  RecentOperation,
  TrendQuery,
  TrendDataPoint,
  AverageBalanceQuery,
  AverageBalanceResponse,
  GeographicDistributionItem,
} from "./kpis.dto";

export interface KpiRepository {
  create(dto: CreateKpiSnapshotDto): Promise<KpiSnapshotRecord>;
  findById(id: string): Promise<KpiSnapshotRecord | null>;
  list(filters: ListKpiSnapshotsQuery): Promise<KpiSnapshotRecord[]>;

  // Dashboard en tiempo real
  getCashSummary(sucursalId?: string): Promise<CashSummary>;
  getTransactionVolume(intervalHours: number, sucursalId?: string): Promise<TransactionVolume[]>;
  getBalanceAlerts(limit: number, sucursalId?: string): Promise<BalanceAlert[]>;
  getRecentOperations(limit: number): Promise<RecentOperation[]>;

  // Trend (Time-Series)
  getTrend(query: TrendQuery): Promise<TrendDataPoint[]>;

  // Average Balance
  getAverageBalance(query: AverageBalanceQuery): Promise<AverageBalanceResponse>;

  // Geographic Distribution
  getGeographicDistribution(): Promise<GeographicDistributionItem[]>;
}
