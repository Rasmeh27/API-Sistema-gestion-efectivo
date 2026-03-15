// modules/cash-movements/cash-movements.service.ts

import { roundMoney } from "../../src/shared/utils/money";
import {
  CashMovementRecord,
  CreateMovementDto,
  ListMovementsQuery,
} from "./cash-movements.dto";
import { CashMovementError } from "./cash-movements.errors";
import { CashMovementRepository } from "./cash-movements.repository";
import { CashboxSessionRepository } from "../cashbox-sessions/cashbox-sessions.repository";

export class CashMovementsService {
  constructor(
    private readonly movements: CashMovementRepository,
    private readonly sessions: CashboxSessionRepository
  ) {}

  async create(dto: CreateMovementDto, usuarioId: string): Promise<CashMovementRecord> {
    const session = await this.sessions.findById(dto.sesionCajaId);
    if (!session) throw CashMovementError.sessionNotFound(dto.sesionCajaId);
    if (session.estado !== "ABIERTA") throw CashMovementError.sessionNotOpen();

    if (dto.tipo === "EGRESO") {
      await this.ensureSufficientFunds(dto.sesionCajaId, session.saldoInicial, dto.monto);
    }

    return this.movements.create(
      { ...dto, monto: roundMoney(dto.monto) },
      usuarioId
    );
  }

  async getById(id: string): Promise<CashMovementRecord> {
    const movement = await this.movements.findById(id);
    if (!movement) throw CashMovementError.notFound(id);
    return movement;
  }

  async list(filters: ListMovementsQuery): Promise<CashMovementRecord[]> {
    return this.movements.list(filters);
  }

  // ── Privados ──────────────────────────────────────────

  private async ensureSufficientFunds(
    sesionCajaId: string,
    saldoInicial: number,
    montoEgreso: number
  ): Promise<void> {
    const totals = await this.movements.sumBySession(sesionCajaId);
    const saldoActual = roundMoney(saldoInicial + totals.ingresos - totals.egresos);

    if (montoEgreso > saldoActual) {
      throw CashMovementError.insufficientFunds();
    }
  }
}
