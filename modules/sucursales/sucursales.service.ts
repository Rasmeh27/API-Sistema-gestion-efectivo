// modules/sucursales/sucursales.service.ts

import {
  CreateSucursalDto,
  SucursalRecord,
  UpdateSucursalDto,
} from "./sucursales.dto";
import { SucursalErrors } from "./sucursales.errors";
import { SucursalRepository } from "./sucursales.repository";

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
