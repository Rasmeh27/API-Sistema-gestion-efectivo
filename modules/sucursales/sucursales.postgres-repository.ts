// modules/sucursales/sucursales.postgres-repository.ts

import { query } from "../../db";
import {
  CreateSucursalDto,
  SucursalRecord,
  SucursalStatus,
  UpdateSucursalDto,
} from "./sucursales.dto";
import { AtmRecord } from "../atm/atm.dto";
import { SucursalRepository } from "./sucursales.repository";

type SucursalRow = {
  id: string;
  codigo: string;
  nombre: string;
  estado: SucursalStatus;
  total_calculado: string;
  latitud: string | null;
  longitud: string | null;
  telefono: string | null;
  direccion: string | null;
  cantidad_atm: string;
};

type AtmRow = {
  id: string;
  sucursal_id: string;
  sucursal_codigo: string;
  sucursal_nombre: string;
  caja_id: string;
  caja_codigo: string;
  caja_nombre: string;
  codigo: string;
  nombre: string;
  estado: string;
  moneda: string;
  limite_operativo: string;
  saldo_actual: string;
};

const SUCURSAL_SELECT = `
  select
    s.id::text as id,
    s.codigo,
    s.nombre,
    s.estado,
    round(
      coalesce(caja_stats.total_cajas, 0)::numeric
      + coalesce(atm_stats.total_atm, 0)::numeric,
      2
    )::text as total_calculado,
    s.latitud,
    s.longitud,
    s.telefono,
    s.direccion,
    coalesce(atm_stats.cantidad_atm, 0)::text as cantidad_atm
  from sucursal s
  left join lateral (
    select
      count(*)::int as cantidad_atm,
      coalesce(sum(a.saldo_actual), 0)::numeric as total_atm
    from atm a
    where a.sucursal_id = s.id
  ) atm_stats on true
  left join lateral (
    select
      coalesce(sum(
        case
          when latest_session.id is null then 0::numeric
          when latest_session.estado = 'ABIERTA' then
            latest_session.saldo_inicial
            + coalesce(session_totals.ingresos, 0)::numeric
            - coalesce(session_totals.egresos, 0)::numeric
          else coalesce(latest_session.saldo_final_real, 0)::numeric
        end
      ), 0)::numeric as total_cajas
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
    ) latest_session on true
    left join lateral (
      select
        coalesce(sum(
          case
            when me.estado = 'ACTIVO' and me.tipo in ('INGRESO', 'REABASTECIMIENTO')
              then me.monto
            else 0
          end
        ), 0)::numeric as ingresos,
        coalesce(sum(
          case
            when me.estado = 'ACTIVO' and me.tipo in ('EGRESO', 'TRANSFERENCIA')
              then me.monto
            else 0
          end
        ), 0)::numeric as egresos
      from movimientoefectivo me
      where me.sesion_caja_id = latest_session.id
    ) session_totals on true
    where c.sucursal_id = s.id
  ) caja_stats on true
`;

export class PgSucursalRepository implements SucursalRepository {
  async create(dto: CreateSucursalDto): Promise<SucursalRecord> {
    const { rows } = await query<{ id: string }>(
      `insert into sucursal
        (codigo, nombre, estado, latitud, longitud, telefono, direccion, total)
       values ($1, $2, $3, $4, $5, $6, $7, 0)
       returning id::text as id`,
      [
        dto.codigo ?? null,
        dto.nombre,
        dto.estado ?? "ACTIVA",
        dto.latitud ?? null,
        dto.longitud ?? null,
        dto.telefono ?? null,
        dto.direccion ?? null,
      ]
    );

    return this.findByIdOrThrow(rows[0].id);
  }

  async findById(id: string): Promise<SucursalRecord | null> {
    const { rows } = await query<SucursalRow>(
      `${SUCURSAL_SELECT} where s.id = $1 limit 1`,
      [id]
    );

    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async findByCode(codigo: string): Promise<SucursalRecord | null> {
    const { rows } = await query<SucursalRow>(
      `${SUCURSAL_SELECT} where lower(s.codigo) = lower($1) limit 1`,
      [codigo]
    );

    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async list(): Promise<SucursalRecord[]> {
    const { rows } = await query<SucursalRow>(
      `${SUCURSAL_SELECT} order by s.nombre asc`
    );

    return rows.map((row) => this.toRecord(row));
  }

  async update(
    id: string,
    dto: UpdateSucursalDto
  ): Promise<SucursalRecord | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (dto.codigo !== undefined) {
      sets.push(`codigo = $${idx++}`);
      values.push(dto.codigo);
    }

    if (dto.nombre !== undefined) {
      sets.push(`nombre = $${idx++}`);
      values.push(dto.nombre);
    }

    if (dto.estado !== undefined) {
      sets.push(`estado = $${idx++}`);
      values.push(dto.estado);
    }

    if (dto.latitud !== undefined) {
      sets.push(`latitud = $${idx++}`);
      values.push(dto.latitud);
    }

    if (dto.longitud !== undefined) {
      sets.push(`longitud = $${idx++}`);
      values.push(dto.longitud);
    }

    if (dto.telefono !== undefined) {
      sets.push(`telefono = $${idx++}`);
      values.push(dto.telefono);
    }

    if (dto.direccion !== undefined) {
      sets.push(`direccion = $${idx++}`);
      values.push(dto.direccion);
    }

    if (sets.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const { rowCount } = await query(
      `update sucursal set ${sets.join(", ")} where id = $${idx}`,
      values
    );

    if ((rowCount ?? 0) === 0) {
      return null;
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await query(`delete from sucursal where id = $1`, [id]);
    return (rowCount ?? 0) > 0;
  }

  async countByCodePrefix(prefix: string): Promise<number> {
    const { rows } = await query<{ count: string }>(
      `select count(*)::text as count
       from sucursal
       where codigo like $1 || '%'`,
      [prefix]
    );

    return Number(rows[0]?.count ?? 0);
  }

  async listAtms(sucursalId: string): Promise<AtmRecord[]> {
    const { rows } = await query<AtmRow>(
      `select
        a.id::text as id,
        a.sucursal_id::text as sucursal_id,
        s.codigo as sucursal_codigo,
        s.nombre as sucursal_nombre,
        a.caja_id::text as caja_id,
        c.codigo as caja_codigo,
        c.nombre as caja_nombre,
        a.codigo,
        a.nombre,
        a.estado,
        a.moneda,
        a.limite_operativo::text as limite_operativo,
        a.saldo_actual::text as saldo_actual
      from atm a
      join sucursal s on s.id = a.sucursal_id
      left join caja c on c.id = a.caja_id
      where a.sucursal_id = $1
      order by a.codigo asc`,
      [sucursalId]
    );

    return rows.map((row) => this.toAtmRecord(row));
  }

  async hasOperationalRelations(id: string): Promise<boolean> {
    const { rows } = await query<{
      cajas: string;
      atms: string;
      usuarios: string;
    }>(
      `select
        (select count(*)::text from caja where sucursal_id = $1) as cajas,
        (select count(*)::text from atm where sucursal_id = $1) as atms,
        (select count(*)::text from usuario where sucursal_default_id = $1) as usuarios`,
      [id]
    );

    const row = rows[0];

    return (
      Number(row?.cajas ?? 0) > 0 ||
      Number(row?.atms ?? 0) > 0 ||
      Number(row?.usuarios ?? 0) > 0
    );
  }

  async syncStoredTotal(id: string): Promise<number> {
    const sucursal = await this.findById(id);
    if (!sucursal) {
      return 0;
    }

    await query(`update sucursal set total = $1 where id = $2`, [sucursal.total, id]);
    return sucursal.total;
  }

  private async findByIdOrThrow(id: string): Promise<SucursalRecord> {
    const record = await this.findById(id);

    if (!record) {
      throw new Error(`Sucursal recién creada con id ${id} no pudo ser cargada`);
    }

    return record;
  }

  private toRecord(row: SucursalRow): SucursalRecord {
    return {
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      estado: row.estado,
      total: Number(row.total_calculado ?? 0),
      latitud: row.latitud !== null ? Number(row.latitud) : null,
      longitud: row.longitud !== null ? Number(row.longitud) : null,
      telefono: row.telefono,
      direccion: row.direccion,
      cantidadAtm: Number(row.cantidad_atm ?? 0),
    };
  }

  private toAtmRecord(row: AtmRow): AtmRecord {
    const balanceActual = Number(row.saldo_actual ?? 0);

    return {
      id: row.id,
      sucursalId: row.sucursal_id,
      sucursalCodigo: row.sucursal_codigo,
      sucursalNombre: row.sucursal_nombre,
      cajaId: row.caja_id,
      cajaCodigo: row.caja_codigo,
      cajaNombre: row.caja_nombre,
      codigo: row.codigo,
      nombre: row.nombre,
      estado: row.estado,
      moneda: row.moneda,
      limiteOperativo: Number(row.limite_operativo ?? 0),
      balanceActual,
      totalOperativo: balanceActual,
    };
  }
}
