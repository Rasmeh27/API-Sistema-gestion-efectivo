// modules/audit/audit.service.ts

import {
  AuditEventRecord,
  CreateAuditEventDto,
  ListAuditEventsQuery,
} from "./audit.dto";
import { AuditError } from "./audit.errors";
import { AuditRepository } from "./audit.repository";

export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  async create(dto: CreateAuditEventDto): Promise<AuditEventRecord> {
    return this.repository.create(dto);
  }

  async getById(id: string): Promise<AuditEventRecord> {
    const event = await this.repository.findById(id);
    if (!event) throw AuditError.notFound(id);
    return event;
  }

  async list(filters: ListAuditEventsQuery): Promise<AuditEventRecord[]> {
    this.validateDateRange(filters.desde, filters.hasta);
    return this.repository.list(filters);
  }

  // ── Privados ──────────────────────────────────────────

  private validateDateRange(desde?: string, hasta?: string): void {
    if (desde && hasta && new Date(desde) >= new Date(hasta)) {
      throw AuditError.invalidDateRange();
    }
  }
}
