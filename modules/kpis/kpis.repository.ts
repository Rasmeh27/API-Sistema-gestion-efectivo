// modules/kpis/kpis.repository.ts

import {
  KpiSnapshotRecord,
  CreateKpiSnapshotDto,
  ListKpiSnapshotsQuery,
} from "./kpis.dto";

export interface KpiRepository {
  create(dto: CreateKpiSnapshotDto): Promise<KpiSnapshotRecord>;
  findById(id: string): Promise<KpiSnapshotRecord | null>;
  list(filters: ListKpiSnapshotsQuery): Promise<KpiSnapshotRecord[]>;
}
