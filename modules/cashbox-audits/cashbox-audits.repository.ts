// modules/cashbox-audits/cashbox-audits.repository.ts

import {
  CashboxAuditRecord,
  CreateAuditDto,
  ListAuditsQuery,
} from "./cashbox-audits.dto";

export interface CashboxAuditRepository {
  create(
    dto: CreateAuditDto,
    usuarioId: string,
    saldoEsperado: number,
    diferencia: number
  ): Promise<CashboxAuditRecord>;

  findById(id: string): Promise<CashboxAuditRecord | null>;

  list(filters: ListAuditsQuery): Promise<CashboxAuditRecord[]>;

  existsBySesionCajaId(sesionCajaId: string): Promise<boolean>;
}
