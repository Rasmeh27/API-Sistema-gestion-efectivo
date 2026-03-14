import { Pool } from "pg";
import { CreateCashboxDto, UpdateCashboxDto } from "./cashboxes.dto";

type CashboxRow = {
  id: string;
  sucursal_id: string;
  codigo: string;
  nombre: string;
  estado: "ACTIVA" | "INACTIVA" | "BLOQUEADA";
  moneda: string;
  limite_operativo: number;
};

export class CashboxesRepository {

  constructor(private readonly pool: Pool) {}

  async create(dto: CreateCashboxDto) {

    const result = await this.pool.query<CashboxRow>(`
      INSERT INTO cashboxes
        (sucursal_id, codigo, nombre, estado, moneda, limite_operativo)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING
        id,
        sucursal_id AS "sucursalId",
        codigo,
        nombre,
        estado,
        moneda,
        limite_operativo AS "limiteOperativo";
    `,
    [
      dto.sucursalId,
      dto.codigo.trim(),
      dto.nombre.trim(),
      dto.estado ?? "ACTIVA",
      dto.moneda ?? "DOP",
      dto.limiteOperativo ?? 0
    ]);

    return result.rows[0];
  }

  async findAll() {

    const result = await this.pool.query<CashboxRow>(`
      SELECT
        id,
        sucursal_id AS "sucursalId",
        codigo,
        nombre,
        estado,
        moneda,
        limite_operativo AS "limiteOperativo"
      FROM cashboxes
      ORDER BY nombre ASC;
    `);

    return result.rows;
  }

  async update(id: string, dto: UpdateCashboxDto) {

    const sets: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (dto.sucursalId !== undefined) {
      sets.push(`sucursal_id = $${index++}`);
      values.push(dto.sucursalId);
    }

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

    if (dto.moneda !== undefined) {
      sets.push(`moneda = $${index++}`);
      values.push(dto.moneda);
    }

    if (dto.limiteOperativo !== undefined) {
      sets.push(`limite_operativo = $${index++}`);
      values.push(dto.limiteOperativo);
    }

    if (sets.length === 0) {
      return null;
    }

    values.push(id);

    const result = await this.pool.query<CashboxRow>(`
      UPDATE cashboxes
      SET ${sets.join(", ")}
      WHERE id = $${index}
      RETURNING
        id,
        sucursal_id AS "sucursalId",
        codigo,
        nombre,
        estado,
        moneda,
        limite_operativo AS "limiteOperativo";
    `, values);

    return result.rows[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {

    const result = await this.pool.query(`
      UPDATE cashboxes
      SET estado = 'INACTIVA'
      WHERE id = $1;
    `,[id]);

    return (result.rowCount ?? 0) > 0;
  }
}