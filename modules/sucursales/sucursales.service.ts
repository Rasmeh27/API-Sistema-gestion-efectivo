// modules/sucursales/sucursales.service.ts

import {
  CreateSucursalDto,
  SucursalRecord,
  UpdateSucursalDto,
} from "./sucursales.dto";
import { SucursalErrors } from "./sucursales.errors";
import { SucursalRepository } from "./sucursales.repository";
import { query } from "../../db";

export class SucursalesService {
  constructor(private readonly sucursales: SucursalRepository) {}

  async create(dto: CreateSucursalDto): Promise<SucursalRecord> {
    await this.ensureCodeAvailable(dto.codigo);
    return this.sucursales.create(dto);
  }

  async list(): Promise<SucursalRecord[]> {
    return this.sucursales.list();
  }

  async getById(id: string): Promise<SucursalRecord> {
    const sucursal = await this.sucursales.findById(id);
    if (!sucursal) {
      throw SucursalErrors.notFound(id);
    }
    return sucursal;
  }

  async update(id: string, dto: UpdateSucursalDto): Promise<SucursalRecord> {
    if (dto.codigo) {
      await this.ensureCodeAvailableForUpdate(dto.codigo, id);
    }
    const updated = await this.sucursales.update(id, dto);
    if (!updated) {
      throw SucursalErrors.notFound(id);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.sucursales.delete(id);
    if (!deleted) {
      throw SucursalErrors.notFound(id);
    }
  }

  /**
   * Calcula y guarda el total de la sucursal:
   * saldo de caja principal (movimientos) + suma de ATMs asociados
   */
  async getTotalSucursal(id: string): Promise<SucursalRecord> {
    const sucursal = await this.sucursales.findById(id);
    if (!sucursal) throw SucursalErrors.notFound(id);

    // Total de movimientos de caja principal
    const { rows: movRows } = await query<{ ingresos: number; egresos: number }>(
      `select
         coalesce(sum(case when tipo = 'INGRESO' then monto else 0 end), 0) as ingresos,
         coalesce(sum(case when tipo = 'EGRESO' then monto else 0 end), 0) as egresos
       from movimientoefectivo
       where caja_id = $1 and estado = 'ACTIVO'`,
      [id]
    );
    const saldoCaja = (movRows[0]?.ingresos ?? 0) - (movRows[0]?.egresos ?? 0);

    // Total de ATMs asociados
    const { rows: atmRows } = await query<{ total: number }>(
      `select coalesce(sum(limite_operativo), 0) as total
       from atm
       where sucursal_id = $1`,
      [id]
    );
    const saldoAtms = atmRows[0]?.total ?? 0;

    const total = saldoCaja + saldoAtms;

    // Guardar el total en la tabla sucursal
    await query(
      `update sucursal set total = $1 where id = $2`,
      [total, id]
    );

    // Devolver el registro actualizado con el total
    return { ...sucursal, total };
  }

  // ── Privados ──────────────────────────────────────────

  private async ensureCodeAvailable(codigo: string): Promise<void> {
    const existing = await this.sucursales.findByCode(codigo);
    if (existing) {
      throw SucursalErrors.codeConflict(codigo);
    }
  }

  private async ensureCodeAvailableForUpdate(
    codigo: string,
    sucursalId: string
  ): Promise<void> {
    const existing = await this.sucursales.findByCode(codigo);
    if (existing && existing.id !== sucursalId) {
      throw SucursalErrors.codeConflict(codigo);
    }
  }
}