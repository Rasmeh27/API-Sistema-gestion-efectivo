// modules/audit/audit.repository.ts

import {
  AuditEventRecord,
  CreateAuditEventDto,
  ListAuditEventsQuery,
} from "./audit.dto";

export interface AuditRepository {
  create(dto: CreateAuditEventDto): Promise<AuditEventRecord>;
  findById(id: string): Promise<AuditEventRecord | null>;
  list(filters: ListAuditEventsQuery): Promise<AuditEventRecord[]>;
}
