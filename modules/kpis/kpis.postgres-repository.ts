// modules/kpis/kpis.postgres-repository.ts

import { query } from "../../db";
import {
  KpiSnapshotRecord,
  CreateKpiSnapshotDto,
  ListKpiSnapshotsQuery,
} from "./kpis.dto";
import { KpiRepository } from "./kpis.repository";

// ── Tipos internos ───────────────────────────────────────

type KpiRow = {
  id: string;
  fecha: string;
  scope: string;
  scope_id: string;
  metricas_json: string | Record<string, unknown>;
};

// ── Constantes SQL ───────────────────────────────────────

const KPI_SELECT = `
  select
    id::text as id,
    fecha,
    scope,
    scope_id::text as scope_id,
    metricas_json
  from kpi_snapshot
`;

// ── Repositorio ──────────────────────────────────────────

export class PgKpiRepository implements KpiRepository {
  async create(dto: CreateKpiSnapshotDto): Promise<KpiSnapshotRecord> {
    const { rows } = await query<KpiRow>(
      `insert into kpi_snapshot
        (fecha, scope, scope_id, metricas_json)
       values (now(), $1, $2, $3)
       returning
         id::text as id, fecha, scope,
         scope_id::text as scope_id,
         metricas_json`,
      [
        dto.scope,
        dto.scopeId,
        JSON.stringify(dto.metricasJson),
      ]
    );

    return this.toRecord(rows[0]);
  }

  async findById(id: string): Promise<KpiSnapshotRecord | null> {
    const { rows } = await query<KpiRow>(
      `${KPI_SELECT} where id = $1 limit 1`,
      [id]
    );

    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async list(filters: ListKpiSnapshotsQuery): Promise<KpiSnapshotRecord[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (filters.scope) {
      conditions.push(`scope = $${idx++}`);
      values.push(filters.scope);
    }

    if (filters.scopeId) {
      conditions.push(`scope_id = $${idx++}`);
      values.push(filters.scopeId);
    }

    if (filters.desde) {
      conditions.push(`fecha >= $${idx++}`);
      values.push(filters.desde);
    }

    if (filters.hasta) {
      conditions.push(`fecha <= $${idx++}`);
      values.push(filters.hasta);
    }

    const where = conditions.length > 0
      ? `where ${conditions.join(" and ")}`
      : "";

    const { rows } = await query<KpiRow>(
      `${KPI_SELECT} ${where} order by fecha desc`,
      values
    );

    return rows.map((row) => this.toRecord(row));
  }

  // ── Privados ──────────────────────────────────────────

  private toRecord(row: KpiRow): KpiSnapshotRecord {
    const metricas =
      typeof row.metricas_json === "string"
        ? JSON.parse(row.metricas_json)
        : row.metricas_json;

    return {
      id: row.id,
      fecha: row.fecha,
      scope: row.scope,
      scopeId: row.scope_id,
      metricasJson: metricas,
    };
  }
}
