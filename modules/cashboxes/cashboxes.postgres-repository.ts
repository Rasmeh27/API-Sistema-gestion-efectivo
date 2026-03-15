// modules/cashboxes/cashboxes.postgres-repository.ts

import { query } from "../../db";
import {
  CashboxRecord,
  CashboxStatus,
  CreateCashboxDto,
  UpdateCashboxDto,
} from "./cashboxes.dto";
import { CashboxRepository } from "./cashboxes.repository";

// ── Tipos internos ───────────────────────────────────────

type CashboxRow = {
  id: string;
  sucursal_id: string;
  codigo: string;
  nombre: string;
  estado: CashboxStatus;
  moneda: string;
  limite_operativo: number;
};

// ── Constantes SQL ───────────────────────────────────────

const CASHBOX_SELECT = `
  select
    id::text as id,
    sucursal_id::text as sucursal_id,
    codigo,
    nombre,
    estado,
    moneda,
    limite_operativo
  from caja
`;

const DEFAULT_MONEDA = "DOP";
const DEFAULT_LIMITE = 0;

// ── Repositorio ──────────────────────────────────────────

export class PgCashboxRepository implements CashboxRepository {
  async create(dto: CreateCashboxDto): Promise<CashboxRecord> {
    const { rows } = await query<CashboxRow>(
      `insert into caja (sucursal_id, codigo, nombre, estado, moneda, limite_operativo)
       values ($1, $2, $3, $4, $5, $6)
       returning
         id::text as id, sucursal_id::text as sucursal_id,
         codigo, nombre, estado, moneda, limite_operativo`,
      [
        dto.sucursalId,
        dto.codigo,
        dto.nombre,
        dto.estado ?? "ACTIVA",
        dto.moneda ?? DEFAULT_MONEDA,
        dto.limiteOperativo ?? DEFAULT_LIMITE,
      ]
    );

    return this.toRecord(rows[0]);
  }

  async findById(id: string): Promise<CashboxRecord | null> {
    const { rows } = await query<CashboxRow>(
      `${CASHBOX_SELECT} where id = $1 limit 1`,
      [id]
    );

    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async findByCode(codigo: string): Promise<CashboxRecord | null> {
    const { rows } = await query<CashboxRow>(
      `${CASHBOX_SELECT} where lower(codigo) = lower($1) limit 1`,
      [codigo]
    );

    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async list(): Promise<CashboxRecord[]> {
    const { rows } = await query<CashboxRow>(
      `${CASHBOX_SELECT} order by nombre asc`
    );

    return rows.map((row) => this.toRecord(row));
  }

  async update(
    id: string,
    dto: UpdateCashboxDto
  ): Promise<CashboxRecord | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (dto.sucursalId !== undefined) {
      sets.push(`sucursal_id = $${idx++}`);
      values.push(dto.sucursalId);
    }

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

    if (dto.moneda !== undefined) {
      sets.push(`moneda = $${idx++}`);
      values.push(dto.moneda);
    }

    if (dto.limiteOperativo !== undefined) {
      sets.push(`limite_operativo = $${idx++}`);
      values.push(dto.limiteOperativo);
    }

    if (sets.length === 0) return this.findById(id);

    values.push(id);

    const { rowCount } = await query(
      `update caja set ${sets.join(", ")} where id = $${idx}`,
      values
    );

    if ((rowCount ?? 0) === 0) return null;

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await query(
      `delete from caja where id = $1`,
      [id]
    );

    return (rowCount ?? 0) > 0;
  }

  // ── Privados ──────────────────────────────────────────

  private toRecord(row: CashboxRow): CashboxRecord {
    return {
      id: row.id,
      sucursalId: row.sucursal_id,
      codigo: row.codigo,
      nombre: row.nombre,
      estado: row.estado,
      moneda: row.moneda,
      limiteOperativo: row.limite_operativo,
    };
  }
}
