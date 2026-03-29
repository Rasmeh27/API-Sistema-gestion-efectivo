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
  TrendQuery,
  TrendDataPoint,
  AverageBalanceQuery,
  AverageBalanceResponse,
  AverageBalanceByCaja,
  GeographicDistributionItem,
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
    const values: unknown[] = [];
    const branchFilter = sucursalId ? `where s.id = $1` : "";
    if (sucursalId) {
      values.push(sucursalId);
    }

    const { rows } = await query<CashSummaryRow>(
      `with latest_sessions as (
         select
           c.id as caja_id,
           c.sucursal_id,
           sc.id as sesion_id,
           sc.estado,
           sc.saldo_inicial,
           sc.saldo_final_real
         from caja c
         left join lateral (
           select
             sc.id,
             sc.estado,
             sc.saldo_inicial,
             sc.saldo_final_real,
             sc.fecha_apertura
           from sesioncaja sc
           where sc.caja_id = c.id
           order by
             case when sc.estado = 'ABIERTA' then 0 else 1 end,
             sc.fecha_apertura desc,
             sc.id desc
           limit 1
         ) sc on true
       ),
       caja_totales as (
         select
           ls.sucursal_id,
           coalesce(sum(
             case
               when ls.sesion_id is null then 0::numeric
               when ls.estado = 'ABIERTA' then
                 ls.saldo_inicial
                 + coalesce(mov.ingresos, 0)::numeric
                 - coalesce(mov.egresos, 0)::numeric
               else coalesce(ls.saldo_final_real, 0)::numeric
             end
           ), 0)::numeric as total_cajas,
           count(case when ls.estado = 'ABIERTA' then 1 end)::int as cajas_abiertas,
           count(case when ls.estado = 'CERRADA' then 1 end)::int as cajas_cerradas
         from latest_sessions ls
         left join lateral (
           select
             coalesce(sum(case when me.estado = 'ACTIVO' and me.tipo in ('INGRESO', 'REABASTECIMIENTO') then me.monto else 0 end), 0)::numeric as ingresos,
             coalesce(sum(case when me.estado = 'ACTIVO' and me.tipo in ('EGRESO', 'TRANSFERENCIA') then me.monto else 0 end), 0)::numeric as egresos
           from movimientoefectivo me
           where me.sesion_caja_id = ls.sesion_id
         ) mov on true
         group by ls.sucursal_id
       ),
       atm_totales as (
         select
           a.sucursal_id,
           coalesce(sum(a.saldo_actual), 0)::numeric as total_atm
         from atm a
         group by a.sucursal_id
       )
       select
         coalesce(sum(coalesce(ct.total_cajas, 0) + coalesce(at.total_atm, 0)), 0)::text as efectivo_total,
         coalesce(sum(coalesce(ct.cajas_abiertas, 0)), 0)::text as cajas_abiertas,
         coalesce(sum(coalesce(ct.cajas_cerradas, 0)), 0)::text as cajas_cerradas
       from sucursal s
       left join caja_totales ct on ct.sucursal_id = s.id
       left join atm_totales at on at.sucursal_id = s.id
       ${branchFilter}`,
      values
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
        u.nombre as usuario
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

  // ── Trend (Time-Series) ────────────────────────────────

  async getTrend(trendQuery: TrendQuery): Promise<TrendDataPoint[]> {
    const groupExpressions: Record<string, string> = {
      day: "DATE(me.fecha)",
      week: "DATE_TRUNC('week', me.fecha)::date",
      month: "DATE_TRUNC('month', me.fecha)::date",
    };

    const groupExpr = groupExpressions[trendQuery.groupBy];
    const conditions = [
      `me.estado = 'ACTIVO'`,
      `me.fecha >= $1`,
      `me.fecha <= $2`,
    ];
    const values: unknown[] = [trendQuery.from, trendQuery.to];
    let idx = 3;

    if (trendQuery.sucursalId) {
      conditions.push(`c.sucursal_id = $${idx++}`);
      values.push(trendQuery.sucursalId);
    }

    const { rows } = await query<{
      fecha: string;
      ingresos: string;
      egresos: string;
      balance: string;
    }>(
      `select
        ${groupExpr} as fecha,
        coalesce(sum(case when me.tipo in ('INGRESO','REABASTECIMIENTO') then me.monto else 0 end), 0)::text as ingresos,
        coalesce(sum(case when me.tipo in ('EGRESO','TRANSFERENCIA') then me.monto else 0 end), 0)::text as egresos,
        coalesce(sum(case when me.tipo in ('INGRESO','REABASTECIMIENTO') then me.monto else 0 end), 0)
          - coalesce(sum(case when me.tipo in ('EGRESO','TRANSFERENCIA') then me.monto else 0 end), 0) as balance
      from movimientoefectivo me
      join caja c on c.id = me.caja_id
      where ${conditions.join(" and ")}
      group by ${groupExpr}
      order by fecha asc`,
      values
    );

    return rows.map((row) => ({
      fecha: typeof row.fecha === "string" ? row.fecha.slice(0, 10) : String(row.fecha),
      ingresos: Number(row.ingresos),
      egresos: Number(row.egresos),
      balance: Number(row.balance),
    }));
  }

  // ── Average Balance ───────────────────────────────────

  async getAverageBalance(avgQuery: AverageBalanceQuery): Promise<AverageBalanceResponse> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (avgQuery.sucursalId) {
      conditions.push(`c.sucursal_id = $${idx++}`);
      values.push(avgQuery.sucursalId);
    }

    if (avgQuery.from) {
      conditions.push(`sc.fecha_apertura >= $${idx++}`);
      values.push(avgQuery.from);
    } else {
      conditions.push(`sc.fecha_apertura >= now() - interval '30 days'`);
    }

    if (avgQuery.to) {
      conditions.push(`sc.fecha_apertura <= $${idx++}`);
      values.push(avgQuery.to);
    }

    const where = conditions.length > 0 ? `where ${conditions.join(" and ")}` : "";

    // Per-caja averages
    const { rows: cajaRows } = await query<{
      caja_id: string;
      caja_nombre: string;
      promedio: string;
    }>(
      `select
        c.id::text as caja_id,
        c.nombre as caja_nombre,
        coalesce(avg(sc.saldo_inicial), 0)::text as promedio
      from sesioncaja sc
      join caja c on c.id = sc.caja_id
      ${where}
      group by c.id, c.nombre
      order by c.nombre asc`,
      values
    );

    // General average
    const { rows: generalRows } = await query<{ promedio: string }>(
      `select coalesce(avg(sc.saldo_inicial), 0)::text as promedio
      from sesioncaja sc
      join caja c on c.id = sc.caja_id
      ${where}`,
      values
    );

    const porCaja: AverageBalanceByCaja[] = cajaRows.map((row) => ({
      cajaId: row.caja_id,
      cajaNombre: row.caja_nombre,
      promedio: Number(row.promedio),
    }));

    return {
      promedioGeneral: Number(generalRows[0]?.promedio ?? 0),
      porCaja,
    };
  }

  // ── Geographic Distribution ───────────────────────────

  async getGeographicDistribution(): Promise<GeographicDistributionItem[]> {
    const { rows } = await query<{
      sucursal_id: string;
      nombre: string;
      codigo: string;
      latitud: string | null;
      longitud: string | null;
      telefono: string | null;
      direccion: string | null;
      cantidad_atm: string;
      efectivo_total: string;
      cajas_abiertas: string;
      cajas_cerradas: string;
    }>(
      `with latest_sessions as (
         select
           c.id as caja_id,
           c.sucursal_id,
           sc.id as sesion_id,
           sc.estado,
           sc.saldo_inicial,
           sc.saldo_final_real
         from caja c
         left join lateral (
           select
             sc.id,
             sc.estado,
             sc.saldo_inicial,
             sc.saldo_final_real,
             sc.fecha_apertura
           from sesioncaja sc
           where sc.caja_id = c.id
           order by
             case when sc.estado = 'ABIERTA' then 0 else 1 end,
             sc.fecha_apertura desc,
             sc.id desc
           limit 1
         ) sc on true
       ),
       caja_totales as (
         select
           ls.sucursal_id,
           coalesce(sum(
             case
               when ls.sesion_id is null then 0::numeric
               when ls.estado = 'ABIERTA' then
                 ls.saldo_inicial
                 + coalesce(mov.ingresos, 0)::numeric
                 - coalesce(mov.egresos, 0)::numeric
               else coalesce(ls.saldo_final_real, 0)::numeric
             end
           ), 0)::numeric as total_cajas,
           count(case when ls.estado = 'ABIERTA' then 1 end)::int as cajas_abiertas,
           count(case when ls.estado = 'CERRADA' then 1 end)::int as cajas_cerradas
         from latest_sessions ls
         left join lateral (
           select
             coalesce(sum(case when me.estado = 'ACTIVO' and me.tipo in ('INGRESO', 'REABASTECIMIENTO') then me.monto else 0 end), 0)::numeric as ingresos,
             coalesce(sum(case when me.estado = 'ACTIVO' and me.tipo in ('EGRESO', 'TRANSFERENCIA') then me.monto else 0 end), 0)::numeric as egresos
           from movimientoefectivo me
           where me.sesion_caja_id = ls.sesion_id
         ) mov on true
         group by ls.sucursal_id
       ),
       atm_totales as (
         select
           a.sucursal_id,
           count(*)::int as cantidad_atm,
           coalesce(sum(a.saldo_actual), 0)::numeric as total_atm
         from atm a
         group by a.sucursal_id
       )
       select
         s.id::text as sucursal_id,
         s.nombre,
         s.codigo,
         s.latitud,
         s.longitud,
         s.telefono,
         s.direccion,
         coalesce(at.cantidad_atm, 0)::text as cantidad_atm,
         round(coalesce(ct.total_cajas, 0)::numeric + coalesce(at.total_atm, 0)::numeric, 2)::text as efectivo_total,
         coalesce(ct.cajas_abiertas, 0)::text as cajas_abiertas,
         coalesce(ct.cajas_cerradas, 0)::text as cajas_cerradas
       from sucursal s
       left join caja_totales ct on ct.sucursal_id = s.id
       left join atm_totales at on at.sucursal_id = s.id
       order by s.nombre asc`
    );

    return rows.map((row) => ({
      sucursalId: row.sucursal_id,
      nombre: row.nombre,
      codigo: row.codigo,
      latitud: row.latitud !== null ? Number(row.latitud) : null,
      longitud: row.longitud !== null ? Number(row.longitud) : null,
      telefono: row.telefono,
      direccion: row.direccion,
      cantidadAtm: Number(row.cantidad_atm),
      efectivoTotal: Number(row.efectivo_total),
      cajasAbiertas: Number(row.cajas_abiertas),
      cajasCerradas: Number(row.cajas_cerradas),
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
