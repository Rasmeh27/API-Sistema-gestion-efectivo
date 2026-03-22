// modules/kpis/kpis.service.ts

import {
  KpiSnapshotRecord,
  CreateKpiSnapshotDto,
  ListKpiSnapshotsQuery,
  DashboardQuery,
  DashboardResponse,
} from "./kpis.dto";
import { KpiError } from "./kpis.errors";
import { KpiRepository } from "./kpis.repository";

export class KpisService {
  constructor(private readonly repository: KpiRepository) {}

  async create(dto: CreateKpiSnapshotDto): Promise<KpiSnapshotRecord> {
    return this.repository.create(dto);
  }

  async getById(id: string): Promise<KpiSnapshotRecord> {
    const snapshot = await this.repository.findById(id);
    if (!snapshot) throw KpiError.notFound(id);
    return snapshot;
  }

  async list(filters: ListKpiSnapshotsQuery): Promise<KpiSnapshotRecord[]> {
    this.validateDateRange(filters.desde, filters.hasta);
    return this.repository.list(filters);
  }

  async dashboard(filters: DashboardQuery): Promise<DashboardResponse> {
    const [
      cashSummary,
      transactionVolume24h,
      transactionVolume7d,
      transactionVolume30d,
      balanceAlerts,
      recentOperations,
    ] = await Promise.all([
      this.repository.getCashSummary(filters.sucursalId),
      this.repository.getTransactionVolume(24, filters.sucursalId),
      this.repository.getTransactionVolume(168, filters.sucursalId),
      this.repository.getTransactionVolume(720, filters.sucursalId),
      this.repository.getBalanceAlerts(20, filters.sucursalId),
      this.repository.getRecentOperations(10),
    ]);

    return {
      cashSummary,
      transactionVolume24h,
      transactionVolume7d,
      transactionVolume30d,
      balanceAlerts,
      recentOperations,
    };
  }

  // ── Privados ──────────────────────────────────────────

  private validateDateRange(desde?: string, hasta?: string): void {
    if (desde && hasta && new Date(desde) >= new Date(hasta)) {
      throw KpiError.invalidDateRange();
    }
  }
}
