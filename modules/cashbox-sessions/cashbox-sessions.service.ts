// modules/cashbox-sessions/cashbox-sessions.service.ts

import {
  CashboxSessionRecord,
  CloseSessionDto,
  ListSessionsQuery,
  OpenSessionDto,
} from "./cashbox-sessions.dto";
import { CashboxSessionErrors } from "./cashbox-sessions.errors";
import { CashboxSessionRepository } from "./cashbox-sessions.repository";
import { CashboxRepository } from "../cashboxes/cashboxes.repository";
import { CashMovementRepository } from "../cash-movements/cash-movements.repository";
import { AuditLogger } from "../audit/audit.logger";
import { nowISO } from "../../src/shared/utils/date";
import { moneyDifference, roundMoney } from "../../src/shared/utils/money";

export class CashboxSessionsService {
  constructor(
    private readonly sessions: CashboxSessionRepository,
    private readonly cashboxes: CashboxRepository,
    private readonly movements: CashMovementRepository,
    private readonly audit: AuditLogger
  ) {}

  async open(dto: OpenSessionDto, userId: string): Promise<CashboxSessionRecord> {
    const cashbox = await this.cashboxes.findById(dto.cajaId);

    if (!cashbox) {
      throw CashboxSessionErrors.cashboxNotFound(dto.cajaId);
    }

    if (cashbox.estado !== "ACTIVA") {
      throw CashboxSessionErrors.cashboxInactive(dto.cajaId);
    }

    const openSession = await this.sessions.findOpenByCajaId(dto.cajaId);

    if (openSession) {
      throw CashboxSessionErrors.alreadyOpen(dto.cajaId);
    }

    const session = await this.sessions.create({
      ...dto,
      saldoInicial: roundMoney(dto.saldoInicial),
      usuarioAperturaId: userId,
      fechaApertura: nowISO(),
    });

    await this.audit.log({
      usuarioId: userId,
      accion: "APERTURA_CAJA",
      entidadTipo: "SESION_CAJA",
      entidadId: session.id,
      resumen: `Apertura de caja ${dto.cajaId} con saldo inicial ${dto.saldoInicial}`,
    });

    return session;
  }

  async close(
    sessionId: string,
    dto: CloseSessionDto,
    userId: string
  ): Promise<CashboxSessionRecord> {
    const session = await this.sessions.findById(sessionId);

    if (!session) {
      throw CashboxSessionErrors.notFound(sessionId);
    }

    if (session.estado === "CERRADA") {
      throw CashboxSessionErrors.alreadyClosed(sessionId);
    }

    const saldoFinalReal = roundMoney(dto.saldoFinalReal);

    const totals = await this.movements.sumBySession(sessionId);
    const saldoFinalEsperado = roundMoney(
      session.saldoInicial + totals.ingresos - totals.egresos
    );

    const diferencia = moneyDifference(saldoFinalReal, saldoFinalEsperado);

    const closed = await this.sessions.close(sessionId, {
      usuarioCierreId: userId,
      fechaCierre: nowISO(),
      saldoFinalEsperado,
      saldoFinalReal,
      diferencia,
    });

    if (!closed) {
      throw CashboxSessionErrors.notFound(sessionId);
    }

    await this.audit.log({
      usuarioId: userId,
      accion: "CIERRE_CAJA",
      entidadTipo: "SESION_CAJA",
      entidadId: sessionId,
      resumen: `Cierre de caja. Esperado: ${saldoFinalEsperado}, Real: ${saldoFinalReal}, Diferencia: ${diferencia}`,
    });

    return closed;
  }

  async getById(id: string): Promise<CashboxSessionRecord> {
    const session = await this.sessions.findById(id);

    if (!session) {
      throw CashboxSessionErrors.notFound(id);
    }

    return session;
  }

  async list(
    query: ListSessionsQuery
  ): Promise<{ items: CashboxSessionRecord[]; total: number }> {
    const offset = (query.page - 1) * query.perPage;

    return this.sessions.list(
      offset,
      query.perPage,
      query.cajaId,
      query.estado
    );
  }
}
