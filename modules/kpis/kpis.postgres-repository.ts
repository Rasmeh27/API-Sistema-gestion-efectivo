// modules/kpis/kpis.postgres-repository.ts

import { query } from "../../db";
import {
  KpiSnapshotRecord,
  CreateKpiSnapshotDto,
  ListKpiSnapshotsQuery,
  CashSummary,
  TransactionVolume,
  BalanceAlert,
  RecentOperation,
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

type CashSummaryRow = {
  efectivo_total: string;
  cajas_abiertas: string;
  cajas_cerradas: string;
};

type VolumeRow = {
  tipo: string;
  cantidad: string;
  total: string;
};

type AlertRow = {
  arqueo_id: string;
  caja_id: string;
  diferencia: number;
  fecha: string;
};

type OperationRow = {
  accion: string;
  resumen: string | null;
  fecha: string;
  usuario: string | null;
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

  // ── Dashboard: consultas en tiempo real ─────────────────

  async getCashSummary(sucursalId?: string): Promise<CashSummary> {
    const sucursalFilter = sucursalId
      ? `and c.sucursal_id = $1`
      : "";

    const params = sucursalId ? [sucursalId] : [];

    const { rows } = await query<CashSummaryRow>(
      `select
        coalesce(sum(
          case when sc.estado = 'ABIERTA' then
            sc.saldo_inicial
            + coalesce((select sum(monto) from movimientoefectivo where sesion_caja_id = sc.id and tipo = 'INGRESO' and estado = 'ACTIVO'), 0)
            - coalesce((select sum(monto) from movimientoefectivo where sesion_caja_id = sc.id and tipo = 'EGRESO' and estado = 'ACTIVO'), 0)
          else 0 end
        ), 0)::text as efectivo_total,
        count(case when sc.estado = 'ABIERTA' then 1 end)::text as cajas_abiertas,
        count(case when sc.estado = 'CERRADA' then 1 end)::text as cajas_cerradas
      from sesioncaja sc
      join caja c on c.id = sc.caja_id
      where sc.fecha_apertura >= now() - interval '30 days'
      ${sucursalFilter}`,
      params
    );

    return {
      efectivoTotalEnCirculacion: Number(rows[0]?.efectivo_total ?? 0),
      cajasAbiertas: Number(rows[0]?.cajas_abiertas ?? 0),
      cajasCerradas: Number(rows[0]?.cajas_cerradas ?? 0),
    };
  }

  async getTransactionVolume(
    intervalHours: number,
    sucursalId?: string
  ): Promise<TransactionVolume[]> {
    const conditions = [`me.estado = 'ACTIVO'`, `me.fecha >= now() - $1 * interval '1 hour'`];
    const values: unknown[] = [intervalHours];
    let idx = 2;

    if (sucursalId) {
      conditions.push(`c.sucursal_id = $${idx++}`);
      values.push(sucursalId);
    }

    const { rows } = await query<VolumeRow>(
      `select
        me.tipo,
        count(*)::text as cantidad,
        coalesce(sum(me.monto), 0)::text as total
      from movimientoefectivo me
      join caja c on c.id = me.caja_id
      where ${conditions.join(" and ")}
      group by me.tipo
      order by me.tipo`,
      values
    );

    return rows.map((row) => ({
      tipo: row.tipo,
      cantidad: Number(row.cantidad),
      total: Number(row.total),
    }));
  }

  async getBalanceAlerts(
    limit: number,
    sucursalId?: string
  ): Promise<BalanceAlert[]> {
    const sucursalFilter = sucursalId
      ? `and c.sucursal_id = $2`
      : "";

    const params: unknown[] = [limit];
    if (sucursalId) params.push(sucursalId);

    const { rows } = await query<AlertRow>(
      `select
        ac.id::text as arqueo_id,
        sc.caja_id::text as caja_id,
        ac.diferencia,
        ac.fecha
      from arqueocaja ac
      join sesioncaja sc on sc.id = ac.sesion_caja_id
      join caja c on c.id = sc.caja_id
      where ac.diferencia != 0 ${sucursalFilter}
      order by ac.fecha desc
      limit $1`,
      params
    );

    return rows.map((row) => ({
      arqueoId: row.arqueo_id,
      cajaId: row.caja_id,
      diferencia: row.diferencia,
      fecha: row.fecha,
    }));
  }

  async getRecentOperations(limit: number): Promise<RecentOperation[]> {
    const { rows } = await query<OperationRow>(
      `select
        ea.accion,
        ea.resumen,
        ea.fecha,
        u.name as usuario
      from eventoauditoria ea
      left join usuario u on u.id = ea.usuario_id
      order by ea.fecha desc
      limit $1`,
      [limit]
    );

    return rows.map((row) => ({
      accion: row.accion,
      resumen: row.resumen,
      fecha: row.fecha,
      usuario: row.usuario,
    }));
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
