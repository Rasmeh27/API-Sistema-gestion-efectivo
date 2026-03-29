// modules/sucursales/sucursales.service.ts

import {
  CreateSucursalDto,
  SucursalRecord,
  UpdateSucursalDto,
  generateCodePrefix,
} from "./sucursales.dto";
import { AtmRecord } from "../atm/atm.dto";
import { SucursalErrors } from "./sucursales.errors";
import { SucursalRepository } from "./sucursales.repository";

export class SucursalesService {
  constructor(private readonly sucursales: SucursalRepository) {}

  async create(dto: CreateSucursalDto): Promise<SucursalRecord> {
    this.ensureCoordinateConsistency(dto.latitud ?? null, dto.longitud ?? null);

    if (dto.codigo) {
      await this.ensureCodeAvailable(dto.codigo);
    } else {
      dto.codigo = await this.generateUniqueCode(dto.nombre);
    }

    const created = await this.sucursales.create(dto);
    await this.sucursales.syncStoredTotal(created.id);
    return this.getById(created.id);
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
    const current = await this.sucursales.findById(id);
    if (!current) {
      throw SucursalErrors.notFound(id);
    }

    if (dto.codigo) {
      await this.ensureCodeAvailableForUpdate(dto.codigo, id);
    }

    this.ensureCoordinateConsistency(
      dto.latitud !== undefined ? dto.latitud : current.latitud,
      dto.longitud !== undefined ? dto.longitud : current.longitud
    );

    const updated = await this.sucursales.update(id, dto);
    if (!updated) {
      throw SucursalErrors.notFound(id);
    }

    await this.sucursales.syncStoredTotal(id);
    return this.getById(id);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.sucursales.findById(id);
    if (!existing) {
      throw SucursalErrors.notFound(id);
    }

    const isInUse = await this.sucursales.hasOperationalRelations(id);
    if (isInUse) {
      throw SucursalErrors.inUse();
    }

    const deleted = await this.sucursales.delete(id);
    if (!deleted) {
      throw SucursalErrors.notFound(id);
    }
  }

  async listAtms(sucursalId: string): Promise<AtmRecord[]> {
    const sucursal = await this.sucursales.findById(sucursalId);
    if (!sucursal) {
      throw SucursalErrors.notFound(sucursalId);
    }

    return this.sucursales.listAtms(sucursalId);
  }

  async getTotalSucursal(id: string): Promise<SucursalRecord> {
    const sucursal = await this.sucursales.findById(id);
    if (!sucursal) {
      throw SucursalErrors.notFound(id);
    }

    await this.sucursales.syncStoredTotal(id);
    return this.getById(id);
  }

  private async generateUniqueCode(nombre: string): Promise<string> {
    const prefix = generateCodePrefix(nombre);
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const count = await this.sucursales.countByCodePrefix(prefix);
      const next = count + 1 + attempt;
      const candidate = `${prefix}-${String(next).padStart(3, "0")}`;
      const existing = await this.sucursales.findByCode(candidate);
      if (!existing) return candidate;
    }

    const fallback = `${prefix}-${Date.now()}`;
    return fallback;
  }

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

  private ensureCoordinateConsistency(
    latitud: number | null,
    longitud: number | null
  ): void {
    const hasLatitud = latitud !== null;
    const hasLongitud = longitud !== null;

    if (hasLatitud !== hasLongitud) {
      throw new Error(
        "latitud y longitud deben enviarse juntas para que el frontend pueda ubicar la sucursal en el mapa"
      );
    }
  }
}
