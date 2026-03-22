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
import { CashboxRepository } from "../cashboxes/cashboxes.repository";
import { AuditLogger } from "../audit/audit.logger";

export class CashMovementsService {
  constructor(
    private readonly movements: CashMovementRepository,
    private readonly sessions: CashboxSessionRepository,
    private readonly cashboxes: CashboxRepository,
    private readonly audit: AuditLogger
  ) {}

  async create(dto: CreateMovementDto, usuarioId: string): Promise<CashMovementRecord | CashMovementRecord[]> {
    const session = await this.sessions.findById(dto.sesionCajaId);
    if (!session) throw CashMovementError.sessionNotFound(dto.sesionCajaId);
    if (session.estado !== "ABIERTA") throw CashMovementError.sessionNotOpen();

    // Validar límite operativo de la caja
    await this.ensureWithinOperationalLimit(dto.cajaId, dto.monto);

    switch (dto.tipo) {
      case "INGRESO":
        return this.createIngreso(dto, usuarioId);
      case "EGRESO":
        return this.createEgreso(dto, usuarioId, session.saldoInicial);
      case "TRANSFERENCIA":
        return this.createTransferencia(dto, usuarioId, session.saldoInicial);
      case "REABASTECIMIENTO":
        return this.createReabastecimiento(dto, usuarioId);
    }
  }

  async getById(id: string): Promise<CashMovementRecord> {
    const movement = await this.movements.findById(id);
    if (!movement) throw CashMovementError.notFound(id);
    return movement;
  }

  async list(filters: ListMovementsQuery): Promise<CashMovementRecord[]> {
    return this.movements.list(filters);
  }

  async void(id: string, usuarioId: string): Promise<CashMovementRecord> {
    const movement = await this.movements.findById(id);
    if (!movement) throw CashMovementError.notFound(id);
    if (movement.estado === "ANULADO") throw CashMovementError.alreadyVoided(id);

    // Verificar que la sesión siga abierta
    const session = await this.sessions.findById(movement.sesionCajaId);
    if (!session || session.estado !== "ABIERTA") throw CashMovementError.sessionNotOpen();

    const voided = await this.movements.voidById(id);
    if (!voided) throw CashMovementError.notFound(id);

    await this.audit.log({
      usuarioId,
      accion: "MOVIMIENTO_ANULADO",
      entidadTipo: "MOVIMIENTO",
      entidadId: id,
      resumen: `Anulación de ${movement.tipo} por ${movement.monto} ${movement.moneda}`,
      beforeJson: JSON.stringify({ estado: "ACTIVO" }),
      afterJson: JSON.stringify({ estado: "ANULADO" }),
    });

    return voided;
  }

  // ── Creación por tipo ──────────────────────────────────

  private async createIngreso(
    dto: CreateMovementDto,
    usuarioId: string
  ): Promise<CashMovementRecord> {
    const movement = await this.movements.create(
      { ...dto, monto: roundMoney(dto.monto) },
      usuarioId
    );

    await this.audit.log({
      usuarioId,
      accion: "MOVIMIENTO_CREADO",
      entidadTipo: "MOVIMIENTO",
      entidadId: movement.id,
      resumen: `INGRESO de ${dto.monto} ${dto.moneda ?? "DOP"} en caja ${dto.cajaId}`,
    });

    return movement;
  }

  private async createEgreso(
    dto: CreateMovementDto,
    usuarioId: string,
    saldoInicial: number
  ): Promise<CashMovementRecord> {
    await this.ensureSufficientFunds(dto.sesionCajaId, saldoInicial, dto.monto);

    const movement = await this.movements.create(
      { ...dto, monto: roundMoney(dto.monto) },
      usuarioId
    );

    await this.audit.log({
      usuarioId,
      accion: "MOVIMIENTO_CREADO",
      entidadTipo: "MOVIMIENTO",
      entidadId: movement.id,
      resumen: `EGRESO de ${dto.monto} ${dto.moneda ?? "DOP"} en caja ${dto.cajaId}`,
    });

    return movement;
  }

  private async createTransferencia(
    dto: CreateMovementDto,
    usuarioId: string,
    saldoInicial: number
  ): Promise<CashMovementRecord[]> {
    const cajaOrigen = await this.cashboxes.findById(dto.cajaOrigenId!);
    if (!cajaOrigen) throw CashMovementError.cashboxNotFound(dto.cajaOrigenId!);

    const cajaDestino = await this.cashboxes.findById(dto.cajaDestinoId!);
    if (!cajaDestino) throw CashMovementError.cashboxNotFound(dto.cajaDestinoId!);

    await this.ensureSufficientFunds(dto.sesionCajaId, saldoInicial, dto.monto);

    const montoRedondeado = roundMoney(dto.monto);
    const referenciaTransferencia = dto.referencia ?? `TRANSF-${Date.now()}`;

    const egresoOrigen = await this.movements.create(
      {
        tipo: "EGRESO",
        medio: dto.medio,
        monto: montoRedondeado,
        moneda: dto.moneda,
        referencia: referenciaTransferencia,
        observacion: dto.observacion ?? `Transferencia a caja ${cajaDestino.id}`,
        cajaId: dto.cajaOrigenId!,
        sesionCajaId: dto.sesionCajaId,
        cajaOrigenId: dto.cajaOrigenId,
        cajaDestinoId: dto.cajaDestinoId,
      },
      usuarioId
    );

    const sesionDestino = await this.sessions.findOpenByCajaId(dto.cajaDestinoId!);
    if (!sesionDestino) throw CashMovementError.sessionNotOpen();

    const ingresoDestino = await this.movements.create(
      {
        tipo: "INGRESO",
        medio: dto.medio,
        monto: montoRedondeado,
        moneda: dto.moneda,
        referencia: referenciaTransferencia,
        observacion: dto.observacion ?? `Transferencia desde caja ${cajaOrigen.id}`,
        cajaId: dto.cajaDestinoId!,
        sesionCajaId: sesionDestino.id,
        cajaOrigenId: dto.cajaOrigenId,
        cajaDestinoId: dto.cajaDestinoId,
      },
      usuarioId
    );

    await this.audit.log({
      usuarioId,
      accion: "TRANSFERENCIA_REALIZADA",
      entidadTipo: "MOVIMIENTO",
      entidadId: egresoOrigen.id,
      resumen: `Transferencia de ${montoRedondeado} ${dto.moneda ?? "DOP"} de caja ${dto.cajaOrigenId} a caja ${dto.cajaDestinoId}`,
    });

    return [egresoOrigen, ingresoDestino];
  }

  private async createReabastecimiento(
    dto: CreateMovementDto,
    usuarioId: string
  ): Promise<CashMovementRecord> {
    const cajaDestino = await this.cashboxes.findById(dto.cajaDestinoId!);
    if (!cajaDestino) throw CashMovementError.cashboxNotFound(dto.cajaDestinoId!);

    const movement = await this.movements.create(
      {
        tipo: "INGRESO",
        medio: dto.medio,
        monto: roundMoney(dto.monto),
        moneda: dto.moneda,
        referencia: dto.referencia ?? `REAB-${Date.now()}`,
        observacion: dto.observacion ?? `Reabastecimiento a caja ${cajaDestino.id}`,
        cajaId: dto.cajaDestinoId!,
        sesionCajaId: dto.sesionCajaId,
        cajaOrigenId: undefined,
        cajaDestinoId: dto.cajaDestinoId,
      },
      usuarioId
    );

    await this.audit.log({
      usuarioId,
      accion: "REABASTECIMIENTO_REALIZADO",
      entidadTipo: "MOVIMIENTO",
      entidadId: movement.id,
      resumen: `Reabastecimiento de ${dto.monto} ${dto.moneda ?? "DOP"} a caja ${dto.cajaDestinoId}`,
    });

    return movement;
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

  private async ensureWithinOperationalLimit(
    cajaId: string,
    monto: number
  ): Promise<void> {
    const cashbox = await this.cashboxes.findById(cajaId);

    if (cashbox && cashbox.limiteOperativo > 0 && monto > cashbox.limiteOperativo) {
      throw CashMovementError.limitExceeded(monto, cashbox.limiteOperativo);
    }
  }
}
