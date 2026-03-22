// modules/cashbox-audits/cashbox-audits.postgres-repository.ts

import { query } from "../../db";
import {
  CashboxAuditRecord,
  CreateAuditDto,
  Currency,
  ListAuditsQuery,
} from "./cashbox-audits.dto";
import { CashboxAuditRepository } from "./cashbox-audits.repository";

// ── Tipos internos ───────────────────────────────────────

type AuditRow = {
  id: string;
  sesion_caja_id: string;
  usuario_id: string;
  fecha: string;
  moneda: string;
  saldo_contado: number;
  saldo_esperado: number;
  diferencia: number;
  motivo_diferencia: string | null;
  observaciones: string | null;
};

// ── Constantes SQL ───────────────────────────────────────

const AUDIT_SELECT = `
  select
    id::text as id,
    sesion_caja_id::text as sesion_caja_id,
    usuario_id::text as usuario_id,
    fecha,
    moneda,
    saldo_contado,
    saldo_esperado,
    diferencia,
    motivo_diferencia,
    observaciones
  from arqueocaja
`;

// ── Repositorio ──────────────────────────────────────────

export class PgCashboxAuditRepository implements CashboxAuditRepository {
  async create(
    dto: CreateAuditDto,
    usuarioId: string,
    saldoEsperado: number,
    diferencia: number
  ): Promise<CashboxAuditRecord> {
    const { rows } = await query<AuditRow>(
      `insert into arqueocaja
        (sesion_caja_id, usuario_id, fecha, moneda, saldo_contado, saldo_esperado, diferencia, motivo_diferencia, observaciones)
       values ($1, $2, now(), $3, $4, $5, $6, $7, $8)
       returning
         id::text as id,
         sesion_caja_id::text as sesion_caja_id,
         usuario_id::text as usuario_id,
         fecha,
         moneda,
         saldo_contado,
         saldo_esperado,
         diferencia,
         motivo_diferencia,
         observaciones`,
      [
        dto.sesionCajaId,
        usuarioId,
        dto.moneda,
        dto.saldoContado,
        saldoEsperado,
        diferencia,
        dto.motivoDiferencia ?? null,
        dto.observaciones ?? null,
      ]
    );

    return this.toRecord(rows[0]);
  }

  async findById(id: string): Promise<CashboxAuditRecord | null> {
    const { rows } = await query<AuditRow>(
      `${AUDIT_SELECT} where id = $1 limit 1`,
      [id]
    );

    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async list(filters: ListAuditsQuery): Promise<CashboxAuditRecord[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (filters.sesionCajaId) {
      conditions.push(`sesion_caja_id = $${idx++}`);
      values.push(filters.sesionCajaId);
    }

    const where = conditions.length > 0
      ? `where ${conditions.join(" and ")}`
      : "";

    const { rows } = await query<AuditRow>(
      `${AUDIT_SELECT} ${where} order by fecha desc`,
      values
    );

    return rows.map((row) => this.toRecord(row));
  }

  async existsBySesionCajaId(sesionCajaId: string): Promise<boolean> {
    const { rows } = await query<{ exists: boolean }>(
      `select exists(select 1 from arqueocaja where sesion_caja_id = $1) as exists`,
      [sesionCajaId]
    );

    return rows[0]?.exists ?? false;
  }

  // ── Privados ──────────────────────────────────────────

  private toRecord(row: AuditRow): CashboxAuditRecord {
    return {
      id: row.id,
      sesionCajaId: row.sesion_caja_id,
      usuarioId: row.usuario_id,
      fecha: row.fecha,
      moneda: (row.moneda ?? "DOP") as Currency,
      saldoContado: row.saldo_contado,
      saldoEsperado: row.saldo_esperado,
      diferencia: row.diferencia,
      motivoDiferencia: row.motivo_diferencia,
      observaciones: row.observaciones,
    };
  }
}
