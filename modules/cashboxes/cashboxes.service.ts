// modules/cashboxes/cashboxes.service.ts

import {
  CashboxRecord,
  CreateCashboxDto,
  UpdateCashboxDto,
} from "./cashboxes.dto";
import { CashboxErrors } from "./cashboxes.errors";
import { CashboxRepository } from "./cashboxes.repository";
import { UserRepository } from "../users/users.repository";

export class CashboxesService {
  constructor(
    private readonly cashboxes: CashboxRepository,
    private readonly users: UserRepository
  ) {}

  async create(dto: CreateCashboxDto): Promise<CashboxRecord> {
    if (dto.codigo) {
      await this.ensureCodeAvailable(dto.codigo);
    } else {
      dto.codigo = await this.generateUniqueCode(dto.sucursalId, dto.moneda ?? "DOP");
    }

    await this.validateResponsible(dto.sucursalId, dto.responsableId);

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
    const existing = await this.cashboxes.findById(id);

    if (!existing) {
      throw CashboxErrors.notFound(id);
    }

    if (dto.codigo) {
      await this.ensureCodeAvailableForUpdate(dto.codigo, id);
    }

    const targetSucursalId = dto.sucursalId ?? existing.sucursalId;
    const targetResponsibleId = dto.responsableId !== undefined
      ? dto.responsableId
      : existing.responsableId;

    await this.validateResponsible(targetSucursalId, targetResponsibleId);

    const updated = await this.cashboxes.update(id, dto);

    if (!updated) {
      throw CashboxErrors.notFound(id);
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.cashboxes.findById(id);

    if (!existing) {
      throw CashboxErrors.notFound(id);
    }

    const isInUse = await this.cashboxes.hasOperationalRelations(id);
    if (isInUse) {
      throw CashboxErrors.inUse();
    }

    const deleted = await this.cashboxes.delete(id);

    if (!deleted) {
      throw CashboxErrors.notFound(id);
    }
  }

  // ── Privados ──────────────────────────────────────────

  private async generateUniqueCode(sucursalId: string, moneda: string): Promise<string> {
    const sucursalCodigo = await this.cashboxes.getSucursalCodigo(sucursalId);
    const prefix = `${sucursalCodigo ?? "CAJ"}-${moneda.toUpperCase()}-`;
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const count = await this.cashboxes.countByCodePrefix(prefix);
      const next = count + 1 + attempt;
      const candidate = `${prefix}${String(next).padStart(2, "0")}`;
      const existing = await this.cashboxes.findByCode(candidate);
      if (!existing) return candidate;
    }

    const fallback = `${prefix}${Date.now()}`;
    return fallback;
  }

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

  private async validateResponsible(
    sucursalId: string,
    responsableId?: string | null
  ): Promise<void> {
    if (responsableId === undefined || responsableId === null) {
      return;
    }

    const user = await this.users.findById(responsableId);

    if (!user) {
      throw CashboxErrors.responsibleNotFound(responsableId);
    }

    if (user.status !== "ACTIVO") {
      throw CashboxErrors.responsibleInactive(responsableId);
    }

    if (!user.sucursalDefaultId || user.sucursalDefaultId !== sucursalId) {
      throw CashboxErrors.responsibleBranchMismatch();
    }
  }
}
