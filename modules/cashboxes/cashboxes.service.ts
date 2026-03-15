// modules/cashboxes/cashboxes.service.ts

import {
  CashboxRecord,
  CreateCashboxDto,
  UpdateCashboxDto,
} from "./cashboxes.dto";
import { CashboxErrors } from "./cashboxes.errors";
import { CashboxRepository } from "./cashboxes.repository";

export class CashboxesService {
  constructor(private readonly cashboxes: CashboxRepository) {}

  async create(dto: CreateCashboxDto): Promise<CashboxRecord> {
    await this.ensureCodeAvailable(dto.codigo);

    return this.cashboxes.create(dto);
  }

  async list(): Promise<CashboxRecord[]> {
    return this.cashboxes.list();
  }

  async getById(id: string): Promise<CashboxRecord> {
    const cashbox = await this.cashboxes.findById(id);

    if (!cashbox) {
      throw CashboxErrors.notFound(id);
    }

    return cashbox;
  }

  async update(id: string, dto: UpdateCashboxDto): Promise<CashboxRecord> {
    if (dto.codigo) {
      await this.ensureCodeAvailableForUpdate(dto.codigo, id);
    }

    const updated = await this.cashboxes.update(id, dto);

    if (!updated) {
      throw CashboxErrors.notFound(id);
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.cashboxes.delete(id);

    if (!deleted) {
      throw CashboxErrors.notFound(id);
    }
  }

  // ── Privados ──────────────────────────────────────────

  private async ensureCodeAvailable(codigo: string): Promise<void> {
    const existing = await this.cashboxes.findByCode(codigo);

    if (existing) {
      throw CashboxErrors.codeConflict(codigo);
    }
  }

  private async ensureCodeAvailableForUpdate(
    codigo: string,
    cashboxId: string
  ): Promise<void> {
    const existing = await this.cashboxes.findByCode(codigo);

    if (existing && existing.id !== cashboxId) {
      throw CashboxErrors.codeConflict(codigo);
    }
  }
}
