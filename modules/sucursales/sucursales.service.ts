import { CreateSucursalDto, UpdateSucursalDto } from "./sucursales.dto";
import { SucursalErrors } from "./sucursales.errors";
import { SucursalRepository } from "./sucursales.repository";

export class SucursalesService {
  constructor(private readonly repo: SucursalRepository) {}

  async createSucursal(dto: CreateSucursalDto) {
    const existing = await this.repo.findByCode(dto.codigo);

    if (existing) {
      throw SucursalErrors.codeConflict(dto.codigo);
    }

    return this.repo.create(dto);
  }

  async listSucursales() {
    return this.repo.list();
  }

  async getSucursal(id: string) {
    const item = await this.repo.findById(id);

    if (!item) {
      throw SucursalErrors.notFound(id);
    }

    return item;
  }

  async updateSucursal(id: string, dto: UpdateSucursalDto) {
    if (dto.codigo) {
      const existing = await this.repo.findByCode(dto.codigo);

      if (existing && existing.id !== id) {
        throw SucursalErrors.codeConflict(dto.codigo);
      }
    }

    const updated = await this.repo.update(id, dto);

    if (!updated) {
      throw SucursalErrors.notFound(id);
    }

    return updated;
  }

  async deleteSucursal(id: string) {
    const deleted = await this.repo.delete(id);

    if (!deleted) {
      throw SucursalErrors.notFound(id);
    }

    return { success: true };
  }
}