// modules/sucursales/sucursales.postgres-repository.ts

import { query } from "../../db";
import {
  CreateSucursalDto,
  SucursalRecord,
  SucursalStatus,
  UpdateSucursalDto,
} from "./sucursales.dto";
import { SucursalRepository } from "./sucursales.repository";

// ── Tipos internos ───────────────────────────────────────

type SucursalRow = {
  id: string;
  codigo: string;
  nombre: string;
  estado: SucursalStatus;
  latitud: string | null;
  longitud: string | null;
};

// ── Constantes SQL ───────────────────────────────────────

const SUCURSAL_SELECT = `
  select
    id::text as id,
    codigo,
    nombre,
    estado,
    latitud,
    longitud
  from sucursal
`;

// ── Repositorio ──────────────────────────────────────────

export class PgSucursalRepository implements SucursalRepository {
  async create(dto: CreateSucursalDto): Promise<SucursalRecord> {
    const { rows } = await query<SucursalRow>(
      `insert into sucursal (codigo, nombre, estado, latitud, longitud)
       values ($1, $2, $3, $4, $5)
       returning id::text as id, codigo, nombre, estado, latitud, longitud`,
      [dto.codigo, dto.nombre, dto.estado ?? "ACTIVA", dto.latitud ?? null, dto.longitud ?? null]
    );

    return this.toRecord(rows[0]);
  }

  async findById(id: string): Promise<SucursalRecord | null> {
    const { rows } = await query<SucursalRow>(
      `${SUCURSAL_SELECT} where id = $1 limit 1`,
      [id]
    );

    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async findByCode(codigo: string): Promise<SucursalRecord | null> {
    const { rows } = await query<SucursalRow>(
      `${SUCURSAL_SELECT} where lower(codigo) = lower($1) limit 1`,
      [codigo]
    );

    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async list(): Promise<SucursalRecord[]> {
    const { rows } = await query<SucursalRow>(
      `${SUCURSAL_SELECT} order by nombre asc`
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

    if (sets.length === 0) return this.findById(id);

    values.push(id);

    const { rowCount } = await query(
      `update sucursal set ${sets.join(", ")} where id = $${idx}`,
      values
    );

    if ((rowCount ?? 0) === 0) return null;

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await query(
      `delete from sucursal where id = $1`,
      [id]
    );

    return (rowCount ?? 0) > 0;
  }

  // ── Privados ──────────────────────────────────────────

  private toRecord(row: SucursalRow): SucursalRecord {
    return {
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      estado: row.estado,
      total: 0,
      latitud: row.latitud !== null ? Number(row.latitud) : null,
      longitud: row.longitud !== null ? Number(row.longitud) : null,
    };
  }
}
