import { CreateTreasuryDto, UpdateTreasuryDto } from "./treasury.dto";
import { TreasuryErrors } from "./treasury.errors";
import { TreasuryRepository } from "./treasury.repository";

export class TreasuryService {
  constructor(private readonly repo: TreasuryRepository) {}

  async createTreasury(dto: CreateTreasuryDto) {
    const existing = await this.repo.findByCode(dto.codigo);
    if (existing) {
      throw TreasuryErrors.codeConflict(dto.codigo);
    }
    return this.repo.create(dto);
  }

  async listTreasuries() {
    return this.repo.list();
  }

  async getTreasury(id: string) {
    const item = await this.repo.findById(id);
    if (!item) {
      throw TreasuryErrors.notFound(id);
    }
    return item;
  }

  async updateTreasury(id: string, dto: UpdateTreasuryDto) {
    if (dto.codigo) {
      const existing = await this.repo.findByCode(dto.codigo);
      if (existing && existing.id !== id) {
        throw TreasuryErrors.codeConflict(dto.codigo);
      }
    }
    const updated = await this.repo.update(id, dto);
    if (!updated) {
      throw TreasuryErrors.notFound(id);
    }
    return updated;
  }

  async deleteTreasury(id: string) {
    const deleted = await this.repo.delete(id);
    if (!deleted) {
      throw TreasuryErrors.notFound(id);
    }
    return { success: true };
  }
}