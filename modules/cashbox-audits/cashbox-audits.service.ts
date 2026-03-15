// modules/cashbox-audits/cashbox-audits.service.ts

import { roundMoney, moneyDifference } from "../../src/shared/utils/money";
import { nowISO } from "../../src/shared/utils/date";
import {
  CashboxAuditRecord,
  CreateAuditDto,
  ListAuditsQuery,
} from "./cashbox-audits.dto";
import { CashboxAuditError } from "./cashbox-audits.errors";
import { CashboxAuditRepository } from "./cashbox-audits.repository";
import { CashboxSessionRepository } from "../cashbox-sessions/cashbox-sessions.repository";

export class CashboxAuditsService {
  constructor(
    private readonly audits: CashboxAuditRepository,
    private readonly sessions: CashboxSessionRepository
  ) {}

  async create(dto: CreateAuditDto, usuarioId: string): Promise<CashboxAuditRecord> {
    const session = await this.sessions.findById(dto.sesionCajaId);
    if (!session) throw CashboxAuditError.sessionNotFound(dto.sesionCajaId);
    if (session.estado !== "CERRADA") throw CashboxAuditError.sessionNotClosed();

    const saldoEsperado = roundMoney(session.saldoFinalEsperado ?? session.saldoInicial);
    const saldoContado = roundMoney(dto.saldoContado);
    const diferencia = moneyDifference(saldoContado, saldoEsperado);

    return this.audits.create(dto, usuarioId, saldoEsperado, diferencia);
  }

  async getById(id: string): Promise<CashboxAuditRecord> {
    const audit = await this.audits.findById(id);
    if (!audit) throw CashboxAuditError.notFound(id);
    return audit;
  }

  async list(filters: ListAuditsQuery): Promise<CashboxAuditRecord[]> {
    return this.audits.list(filters);
  }
}
