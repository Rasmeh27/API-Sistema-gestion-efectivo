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
  responsable_id: string | null;
  responsable_nombre: string | null;
  responsable_email: string | null;
};

// ── Constantes SQL ───────────────────────────────────────

const CASHBOX_SELECT = `
  select
    c.id::text as id,
    c.sucursal_id::text as sucursal_id,
    c.codigo,
    c.nombre,
    c.estado,
    c.moneda,
    c.limite_operativo,
    c.responsable_id::text as responsable_id,
    u.nombre as responsable_nombre,
    u.username_email as responsable_email
  from caja c
  left join usuario u on u.id = c.responsable_id
`;

const CASHBOX_RETURNING = `
  returning
    id::text as id,
    sucursal_id::text as sucursal_id,
    codigo,
    nombre,
    estado,
    moneda,
    limite_operativo,
    responsable_id::text as responsable_id
`;

const DEFAULT_MONEDA = "DOP";
const DEFAULT_LIMITE = 0;

// ── Repositorio ──────────────────────────────────────────

export class PgCashboxRepository implements CashboxRepository {
  async create(dto: CreateCashboxDto): Promise<CashboxRecord> {
    const { rows } = await query<CashboxRow>(
      `insert into caja (sucursal_id, codigo, nombre, estado, moneda, limite_operativo, responsable_id)
       values ($1, $2, $3, $4, $5, $6, $7)
       ${CASHBOX_RETURNING}`,
      [
        dto.sucursalId,
        dto.codigo,
        dto.nombre,
        dto.estado ?? "ACTIVA",
        dto.moneda ?? DEFAULT_MONEDA,
        dto.limiteOperativo ?? DEFAULT_LIMITE,
        dto.responsableId ?? null,
      ]
    );

    return this.findByIdOrThrow(rows[0]?.id);
  }

  async findById(id: string): Promise<CashboxRecord | null> {
    const { rows } = await query<CashboxRow>(
      `${CASHBOX_SELECT} where c.id = $1 limit 1`,
      [id]
    );

    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async findByCode(codigo: string): Promise<CashboxRecord | null> {
    const { rows } = await query<CashboxRow>(
      `${CASHBOX_SELECT} where lower(c.codigo) = lower($1) limit 1`,
      [codigo]
    );

    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async list(): Promise<CashboxRecord[]> {
    const { rows } = await query<CashboxRow>(
      `${CASHBOX_SELECT} order by c.nombre asc`
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

    if (dto.responsableId !== undefined) {
      sets.push(`responsable_id = $${idx++}`);
      values.push(dto.responsableId);
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

  async hasOperationalRelations(id: string): Promise<boolean> {
    const { rows } = await query<{
      sesiones: string;
      atms: string;
      movimientos: string;
    }>(
      `select
        (select count(*)::text from sesioncaja where caja_id = $1) as sesiones,
        (select count(*)::text from atm where caja_id = $1) as atms,
        (select count(*)::text from movimientoefectivo where caja_id = $1) as movimientos`,
      [id]
    );

    const row = rows[0];

    return (
      Number(row?.sesiones ?? 0) > 0 ||
      Number(row?.atms ?? 0) > 0 ||
      Number(row?.movimientos ?? 0) > 0
    );
  }

  async getSucursalCodigo(sucursalId: string): Promise<string | null> {
    const { rows } = await query<{ codigo: string }>(
      `select codigo from sucursal where id = $1 limit 1`,
      [sucursalId]
    );
    return rows[0]?.codigo ?? null;
  }

  async countByCodePrefix(prefix: string): Promise<number> {
    const { rows } = await query<{ count: string }>(
      `select count(*)::text as count
       from caja
       where codigo like $1 || '%'`,
      [prefix]
    );

    return Number(rows[0]?.count ?? 0);
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
      responsableId: row.responsable_id,
      responsableNombre: row.responsable_nombre,
      responsableEmail: row.responsable_email,
    };
  }

  private async findByIdOrThrow(id: string | undefined): Promise<CashboxRecord> {
    if (!id) {
      throw new Error("CASHBOX_CREATE_FAILED");
    }

    const cashbox = await this.findById(id);
    if (!cashbox) {
      throw new Error("CASHBOX_NOT_FOUND_AFTER_WRITE");
    }

    return cashbox;
  }
}
