// modules/cashbox-audits/cashbox-audits.service.ts

import {
  CashboxAuditRecord,
  CreateAuditDto,
  ListAuditsQuery,
} from "./cashbox-audits.dto";
import { CashboxAuditErrors } from "./cashbox-audits.errors";
import { CashboxAuditRepository } from "./cashbox-audits.repository";
import { CashboxSessionRepository } from "../cashbox-sessions/cashbox-sessions.repository";
import { CashMovementRepository } from "../cash-movements/cash-movements.repository";
import { AuditLogger } from "../audit/audit.logger";
import { roundMoney, moneyDifference } from "../../src/shared/utils/money";

export class CashboxAuditsService {
  constructor(
    private readonly audits: CashboxAuditRepository,
    private readonly sessions: CashboxSessionRepository,
    private readonly movements: CashMovementRepository,
    private readonly audit: AuditLogger
  ) {}

  async create(
    dto: CreateAuditDto,
    userId: string
  ): Promise<CashboxAuditRecord> {
    const session = await this.sessions.findById(dto.sesionCajaId);

    if (!session) {
      throw CashboxAuditErrors.sessionNotFound(dto.sesionCajaId);
    }

    if (session.estado !== "ABIERTA") {
      throw CashboxAuditErrors.sessionNotOpen();
    }

    // Calcular saldo esperado en tiempo real desde los movimientos
    const totals = await this.movements.sumBySession(dto.sesionCajaId);
    const saldoEsperado = roundMoney(
      session.saldoInicial + totals.ingresos - totals.egresos
    );

    const saldoContado = roundMoney(dto.saldoContado);
    const diferencia = moneyDifference(saldoContado, saldoEsperado);

    const record = await this.audits.create(
      dto,
      userId,
      saldoEsperado,
      diferencia
    );

    await this.audit.log({
      usuarioId: userId,
      accion: "ARQUEO_REALIZADO",
      entidadTipo: "ARQUEO",
      entidadId: record.id,
      resumen: `Arqueo en sesión ${dto.sesionCajaId}. Contado: ${saldoContado}, Esperado: ${saldoEsperado}, Diferencia: ${diferencia}`,
    });

    return record;
  }

  async getById(id: string): Promise<CashboxAuditRecord> {
    const record = await this.audits.findById(id);

    if (!record) {
      throw CashboxAuditErrors.notFound(id);
    }

    return record;
  }

  async list(filters: ListAuditsQuery): Promise<CashboxAuditRecord[]> {
    return this.audits.list(filters);
  }
}
