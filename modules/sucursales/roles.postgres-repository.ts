import { query } from "../../db";
import { CreateSucursalDto, SucursalRecord, UpdateSucursalDto } from "./sucursales.dto";
import { SucursalRepository } from "./sucursales.repository";

type SucursalRow = {
  id: string;
  codigo: string;
  nombre: string;
  estado: "ACTIVA" | "INACTIVA";
};

export class PgSucursalRepository implements SucursalRepository {
  async create(dto: CreateSucursalDto): Promise<SucursalRecord> {
    const result = await query<SucursalRow>(
      `
        insert into sucursal (codigo, nombre, estado)
        values ($1, $2, $3)
        returning
          id::text as id,
          codigo,
          nombre,
          estado;
      `,
      [dto.codigo, dto.nombre, dto.estado ?? "ACTIVA"]
    );

    return this.map(result.rows[0]);
  }

  async findById(id: string): Promise<SucursalRecord | null> {
    const result = await query<SucursalRow>(
      `
        select
          id::text as id,
          codigo,
          nombre,
          estado
        from sucursal
        where id = $1
        limit 1;
      `,
      [id]
    );

    const row = result.rows[0];

    return row ? this.map(row) : null;
  }

  async findByCode(codigo: string): Promise<SucursalRecord | null> {
    const result = await query<SucursalRow>(
      `
        select
          id::text as id,
          codigo,
          nombre,
          estado
        from sucursal
        where lower(codigo) = lower($1)
        limit 1;
      `,
      [codigo]
    );

    const row = result.rows[0];

    return row ? this.map(row) : null;
  }

  async list(): Promise<SucursalRecord[]> {
    const result = await query<SucursalRow>(
      `
        select
          id::text as id,
          codigo,
          nombre,
          estado
        from sucursal
        order by nombre asc;
      `
    );

    return result.rows.map((row) => this.map(row));
  }

  async update(id: string, dto: UpdateSucursalDto): Promise<SucursalRecord | null> {
    const existing = await this.findById(id);

    if (!existing) {
      return null;
    }

    const sets: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (dto.codigo !== undefined) {
      sets.push(`codigo = $${index++}`);
      values.push(dto.codigo);
    }

    if (dto.nombre !== undefined) {
      sets.push(`nombre = $${index++}`);
      values.push(dto.nombre);
    }

    if (dto.estado !== undefined) {
      sets.push(`estado = $${index++}`);
      values.push(dto.estado);
    }

    values.push(id);

    await query(
      `
        update sucursal
        set ${sets.join(", ")}
        where id = $${index};
      `,
      values
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await query(
      `
        delete from sucursal
        where id = $1;
      `,
      [id]
    );

    return (result.rowCount ?? 0) > 0;
  }

  private map(row: SucursalRow): SucursalRecord {
    return {
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      estado: row.estado,
    };
  }
}