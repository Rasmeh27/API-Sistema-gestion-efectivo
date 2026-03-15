// modules/cashbox-sessions/cashbox-sessions.postgres-repository.ts

import { query } from "../../db";
import {
  CashboxSessionRecord,
  CashboxSessionStatus,
  OpenSessionDto,
} from "./cashbox-sessions.dto";
import { CashboxSessionRepository } from "./cashbox-sessions.repository";

// ── Tipos internos ───────────────────────────────────────

type SessionRow = {
  id: string;
  caja_id: string;
  usuario_apertura_id: string;
  fecha_apertura: string;
  saldo_inicial: number;
  usuario_cierre_id: string | null;
  fecha_cierre: string | null;
  saldo_final_esperado: number;
  saldo_final_real: number;
  diferencia: number;
  estado: CashboxSessionStatus;
};

type CountRow = { total: string };

// ── Constantes SQL ───────────────────────────────────────

const SESSION_SELECT = `
  select
    id::text as id,
    caja_id::text as caja_id,
    usuario_apertura_id::text as usuario_apertura_id,
    fecha_apertura,
    saldo_inicial,
    usuario_cierre_id::text as usuario_cierre_id,
    fecha_cierre,
    saldo_final_esperado,
    saldo_final_real,
    diferencia,
    estado
  from sesioncaja
`;

// ── Repositorio ──────────────────────────────────────────

export class PgCashboxSessionRepository implements CashboxSessionRepository {
  async create(
    dto: OpenSessionDto & { usuarioAperturaId: string; fechaApertura: string }
  ): Promise<CashboxSessionRecord> {
    const { rows } = await query<SessionRow>(
      `insert into sesioncaja
         (caja_id, usuario_apertura_id, fecha_apertura, saldo_inicial,
          saldo_final_esperado, saldo_final_real, diferencia, estado)
       values ($1, $2, $3, $4, 0, 0, 0, 'ABIERTA')
       returning
         id::text as id, caja_id::text as caja_id,
         usuario_apertura_id::text as usuario_apertura_id,
         fecha_apertura, saldo_inicial,
         usuario_cierre_id::text as usuario_cierre_id,
         fecha_cierre, saldo_final_esperado, saldo_final_real,
         diferencia, estado`,
      [dto.cajaId, dto.usuarioAperturaId, dto.fechaApertura, dto.saldoInicial]
    );

    return this.toRecord(rows[0]);
  }

  async findById(id: string): Promise<CashboxSessionRecord | null> {
    const { rows } = await query<SessionRow>(
      `${SESSION_SELECT} where id = $1 limit 1`,
      [id]
    );

    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async findOpenByCajaId(cajaId: string): Promise<CashboxSessionRecord | null> {
    const { rows } = await query<SessionRow>(
      `${SESSION_SELECT} where caja_id = $1 and estado = 'ABIERTA' limit 1`,
      [cajaId]
    );

    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async close(
    id: string,
    data: {
      usuarioCierreId: string;
      fechaCierre: string;
      saldoFinalEsperado: number;
      saldoFinalReal: number;
      diferencia: number;
    }
  ): Promise<CashboxSessionRecord | null> {
    const { rowCount } = await query(
      `update sesioncaja
       set usuario_cierre_id = $1,
           fecha_cierre = $2,
           saldo_final_esperado = $3,
           saldo_final_real = $4,
           diferencia = $5,
           estado = 'CERRADA'
       where id = $6 and estado = 'ABIERTA'`,
      [
        data.usuarioCierreId,
        data.fechaCierre,
        data.saldoFinalEsperado,
        data.saldoFinalReal,
        data.diferencia,
        id,
      ]
    );

    if ((rowCount ?? 0) === 0) return null;

    return this.findById(id);
  }

  async list(
    offset: number,
    limit: number,
    cajaId?: string,
    estado?: CashboxSessionStatus
  ): Promise<{ items: CashboxSessionRecord[]; total: number }> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (cajaId) {
      conditions.push(`caja_id = $${idx++}`);
      values.push(cajaId);
    }

    if (estado) {
      conditions.push(`estado = $${idx++}`);
      values.push(estado);
    }

    const where = conditions.length > 0
      ? `where ${conditions.join(" and ")}`
      : "";

    const countResult = await query<CountRow>(
      `select count(*)::text as total from sesioncaja ${where}`,
      values
    );

    const total = Number(countResult.rows[0]?.total ?? "0");

    const dataValues = [...values, limit, offset];

    const { rows } = await query<SessionRow>(
      `${SESSION_SELECT} ${where}
       order by fecha_apertura desc
       limit $${idx++} offset $${idx}`,
      dataValues
    );

    return {
      items: rows.map((row) => this.toRecord(row)),
      total,
    };
  }

  // ── Privados ──────────────────────────────────────────

  private toRecord(row: SessionRow): CashboxSessionRecord {
    return {
      id: row.id,
      cajaId: row.caja_id,
      usuarioAperturaId: row.usuario_apertura_id,
      fechaApertura: row.fecha_apertura,
      saldoInicial: Number(row.saldo_inicial),
      usuarioCierreId: row.usuario_cierre_id,
      fechaCierre: row.fecha_cierre,
      saldoFinalEsperado: Number(row.saldo_final_esperado),
      saldoFinalReal: Number(row.saldo_final_real),
      diferencia: Number(row.diferencia),
      estado: row.estado,
    };
  }
}
