import { query } from "../../db";
import { AtmRecord, DepositDto, WithdrawDto } from "./atm.dto";
import { AtmRepository } from "./atm.repository";

type AtmRow = {
  id: string;
  sucursal_id: string;
  codigo: string;
  nombre: string;
  estado: string;
  moneda: string;
  limite_operativo: number;
};

const ATM_SELECT = `
  select
    id::text as id,
    sucursal_id::text as sucursal_id,
    codigo,
    nombre,
    estado,
    moneda,
    limite_operativo
  from atm
`;

export class PgAtmRepository implements AtmRepository {
  async findById(id: string): Promise<AtmRecord | null> {
    const { rows } = await query<AtmRow>(`${ATM_SELECT} where id = $1 limit 1`, [id]);
    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async deposit(id: string, dto: DepositDto): Promise<AtmRecord> {
    const { rows } = await query<AtmRow>(
      `update atm
       set limite_operativo = limite_operativo + $1
       where id = $2
       returning id::text as id, sucursal_id::text as sucursal_id, codigo, nombre, estado, moneda, limite_operativo`,
      [dto.monto, id]
    );
    return this.toRecord(rows[0]);
  }

async withdraw(id: string, dto: WithdrawDto): Promise<AtmRecord | null> {
  const { rows } = await query<AtmRow>(
    `update atm
     set limite_operativo = limite_operativo - $1
     where id = $2 and limite_operativo >= $1
     returning id::text as id, sucursal_id::text as sucursal_id, codigo, nombre, estado, moneda, limite_operativo`,
    [dto.monto, id]
  );
  return rows[0] ? this.toRecord(rows[0]) : null; // ← correcto
}

  private toRecord(row: AtmRow): AtmRecord {
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