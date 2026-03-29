// modules/cash-movements/cash-movements.postgres-repository.ts

import { query } from "../../db";
import {
  CashMovementRecord,
  CreateMovementDto,
  ListMovementsQuery,
  MovementType,
  MovementStatus,
} from "./cash-movements.dto";
import { CashMovementRepository } from "./cash-movements.repository";

// ── Tipos internos ───────────────────────────────────────

type MovementRow = {
  id: string;
  fecha: string;
  tipo: MovementType;
  medio: string;
  monto: number;
  moneda: string;
  referencia: string | null;
  observacion: string | null;
  estado: MovementStatus;
  caja_id: string;
  sesion_caja_id: string;
  usuario_id: string;
  caja_origen_id: string | null;
  caja_destino_id: string | null;
  atm_id: string | null;
};

type SumRow = {
  ingresos: string;
  egresos: string;
};

// ── Constantes SQL ───────────────────────────────────────

const MOVEMENT_SELECT = `
  select
    id::text as id,
    fecha,
    tipo,
    medio,
    monto,
    moneda,
    referencia,
    observacion,
    estado,
    caja_id::text as caja_id,
    sesion_caja_id::text as sesion_caja_id,
    usuario_id::text as usuario_id,
    caja_origen_id::text as caja_origen_id,
    caja_destino_id::text as caja_destino_id,
    atm_id::text as atm_id
  from movimientoefectivo
`;

// ── Repositorio ──────────────────────────────────────────

export class PgCashMovementRepository implements CashMovementRepository {
  async create(dto: CreateMovementDto, usuarioId: string): Promise<CashMovementRecord> {
    const { rows } = await query<MovementRow>(
      `insert into movimientoefectivo
        (fecha, tipo, medio, monto, moneda, referencia, observacion, estado,
         caja_id, sesion_caja_id, usuario_id, caja_origen_id, caja_destino_id, atm_id)
       values (now(), $1, $2, $3, $4, $5, $6, 'ACTIVO', $7, $8, $9, $10, $11, $12)
       returning
         id::text as id, fecha, tipo, medio, monto, moneda, referencia, observacion, estado,
         caja_id::text as caja_id, sesion_caja_id::text as sesion_caja_id,
         usuario_id::text as usuario_id,
         caja_origen_id::text as caja_origen_id,
         caja_destino_id::text as caja_destino_id,
         atm_id::text as atm_id`,
      [
        dto.tipo,
        dto.medio,
        dto.monto,
        dto.moneda ?? "DOP",
        dto.referencia ?? null,
        dto.observacion ?? null,
        dto.cajaId,
        dto.sesionCajaId,
        usuarioId,
        dto.cajaOrigenId ?? null,
        dto.cajaDestinoId ?? null,
        dto.atmId ?? null,
      ]
    );

    return this.toRecord(rows[0]);
  }

  async findById(id: string): Promise<CashMovementRecord | null> {
    const { rows } = await query<MovementRow>(
      `${MOVEMENT_SELECT} where id = $1 limit 1`,
      [id]
    );

    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async list(filters: ListMovementsQuery): Promise<CashMovementRecord[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (filters.sesionCajaId) {
      conditions.push(`sesion_caja_id = $${idx++}`);
      values.push(filters.sesionCajaId);
    }

    if (filters.cajaId) {
      conditions.push(`caja_id = $${idx++}`);
      values.push(filters.cajaId);
    }

    if (filters.tipo) {
      conditions.push(`tipo = $${idx++}`);
      values.push(filters.tipo);
    }

    if (filters.moneda) {
      conditions.push(`moneda = $${idx++}`);
      values.push(filters.moneda);
    }

    const where = conditions.length > 0
      ? `where ${conditions.join(" and ")}`
      : "";

    const { rows } = await query<MovementRow>(
      `${MOVEMENT_SELECT} ${where} order by fecha desc`,
      values
    );

    return rows.map((row) => this.toRecord(row));
  }

  async sumBySession(sesionCajaId: string): Promise<{ ingresos: number; egresos: number }> {
    const { rows } = await query<SumRow>(
      `select
        coalesce(sum(case when tipo in ('INGRESO', 'REABASTECIMIENTO') then monto else 0 end), 0) as ingresos,
        coalesce(sum(case when tipo in ('EGRESO', 'TRANSFERENCIA') then monto else 0 end), 0) as egresos
       from movimientoefectivo
       where sesion_caja_id = $1 and estado = 'ACTIVO'`,
      [sesionCajaId]
    );

    return {
      ingresos: Number(rows[0].ingresos),
      egresos: Number(rows[0].egresos),
    };
  }

  async voidById(id: string): Promise<CashMovementRecord | null> {
    const { rowCount } = await query(
      `update movimientoefectivo set estado = 'ANULADO' where id = $1 and estado = 'ACTIVO'`,
      [id]
    );

    if ((rowCount ?? 0) === 0) return null;

    return this.findById(id);
  }

  // ── Privados ──────────────────────────────────────────

  private toRecord(row: MovementRow): CashMovementRecord {
    return {
      id: row.id,
      fecha: row.fecha,
      tipo: row.tipo,
      medio: row.medio,
      monto: row.monto,
      moneda: row.moneda,
      referencia: row.referencia,
      observacion: row.observacion,
      estado: row.estado,
      cajaId: row.caja_id,
      sesionCajaId: row.sesion_caja_id,
      usuarioId: row.usuario_id,
      cajaOrigenId: row.caja_origen_id,
      cajaDestinoId: row.caja_destino_id,
      atmId: row.atm_id,
    };
  }
}
