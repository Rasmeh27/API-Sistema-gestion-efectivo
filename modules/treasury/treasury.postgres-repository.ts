import { query } from "../../db";
import { CreateTreasuryDto, TreasuryRecord, UpdateTreasuryDto } from "./treasury.dto";
import { TreasuryRepository } from "./treasury.repository";

type TreasuryRow = {
  id: string;
  codigo: string;
  nombre: string;
  estado: "ACTIVA" | "INACTIVA";
};

export class PgTreasuryRepository implements TreasuryRepository {

  async create(dto: CreateTreasuryDto): Promise<TreasuryRecord> {
    const result = await query<TreasuryRow>(
      `
      insert into treasury (codigo, nombre, estado)
      values ($1, $2, $3)
      returning id::text as id, codigo, nombre, estado;
      `,
      [
        dto.codigo.trim(),
        dto.nombre.trim(),
        dto.estado ?? "ACTIVA"
      ]
    );

    return this.map(result.rows[0]);
  }

  async findById(id: string): Promise<TreasuryRecord | null> {
    const result = await query<TreasuryRow>(
      `
      select id::text as id, codigo, nombre, estado
      from treasury
      where id = $1
      limit 1;
      `,
      [id]
    );

    return result.rows[0] ? this.map(result.rows[0]) : null;
  }

  async findByCode(codigo: string): Promise<TreasuryRecord | null> {
    const result = await query<TreasuryRow>(
      `
      select id::text as id, codigo, nombre, estado
      from treasury
      where lower(trim(codigo)) = lower(trim($1))
      limit 1;
      `,
      [codigo]
    );

    return result.rows[0] ? this.map(result.rows[0]) : null;
  }

  async list(): Promise<TreasuryRecord[]> {
    const result = await query<TreasuryRow>(
      `
      select id::text as id, codigo, nombre, estado
      from treasury
      order by nombre asc;
      `
    );

    return result.rows.map((row) => this.map(row));
  }

  async update(id: string, dto: UpdateTreasuryDto): Promise<TreasuryRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const sets: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (dto.codigo !== undefined) {
      sets.push(`codigo = $${index++}`);
      values.push(dto.codigo.trim());
    }

    if (dto.nombre !== undefined) {
      sets.push(`nombre = $${index++}`);
      values.push(dto.nombre.trim());
    }

    if (dto.estado !== undefined) {
      sets.push(`estado = $${index++}`);
      values.push(dto.estado);
    }

    if (sets.length === 0) {
      return existing;
    }

    values.push(id);

    await query(
      `
      update treasury
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
      update treasury
      set estado = 'INACTIVA'
      where id = $1;
      `,
      [id]
    );

    return (result.rowCount ?? 0) > 0;
  }

  private map(row: TreasuryRow): TreasuryRecord {
    return {
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      estado: row.estado
    };
  }
}