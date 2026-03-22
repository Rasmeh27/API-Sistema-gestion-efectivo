// modules/fund-requests/fund-requests.service.ts

import { roundMoney } from "../../src/shared/utils/money";
import {
  FundRequestRecord,
  ApprovalRecord,
  CreateFundRequestDto,
  ResolveRequestDto,
  ListFundRequestsQuery,
} from "./fund-requests.dto";
import { FundRequestError } from "./fund-requests.errors";
import { FundRequestRepository } from "./fund-requests.repository";
import { CashMovementRepository } from "../cash-movements/cash-movements.repository";
import { CashboxSessionRepository } from "../cashbox-sessions/cashbox-sessions.repository";
import { AuditLogger } from "../audit/audit.logger";

export class FundRequestsService {
  constructor(
    private readonly requests: FundRequestRepository,
    private readonly movements: CashMovementRepository,
    private readonly sessions: CashboxSessionRepository,
    private readonly audit: AuditLogger
  ) {}

  async create(
    dto: CreateFundRequestDto,
    solicitadaPor: string
  ): Promise<FundRequestRecord> {
    const request = await this.requests.create(
      { ...dto, monto: roundMoney(dto.monto) },
      solicitadaPor
    );

    await this.audit.log({
      usuarioId: solicitadaPor,
      accion: "SOLICITUD_FONDOS_CREADA",
      entidadTipo: "SOLICITUD",
      entidadId: request.id,
      resumen: `Solicitud de ${dto.monto} desde ${dto.origenScope}:${dto.origenId} a ${dto.destinoScope}:${dto.destinoId}`,
    });

    return request;
  }

  async resolve(
    id: string,
    dto: ResolveRequestDto,
    aprobadaPor: string
  ): Promise<{ request: FundRequestRecord; approval: ApprovalRecord }> {
    const existing = await this.requests.findById(id);
    if (!existing) throw FundRequestError.notFound(id);
    if (existing.estado !== "PENDIENTE") throw FundRequestError.alreadyResolved();

    const request = await this.requests.resolve(id, dto, aprobadaPor);
    if (!request) throw FundRequestError.notFound(id);

    const approval = await this.requests.createApproval(id, dto, aprobadaPor);

    const accion = dto.decision === "APROBADA"
      ? "SOLICITUD_APROBADA"
      : "SOLICITUD_RECHAZADA";

    await this.audit.log({
      usuarioId: aprobadaPor,
      accion,
      entidadTipo: "SOLICITUD",
      entidadId: id,
      resumen: `Solicitud ${dto.decision.toLowerCase()}. ${dto.comentario ?? ""}`.trim(),
    });

    return { request, approval };
  }

  async execute(
    id: string,
    ejecutadaPor: string
  ): Promise<FundRequestRecord> {
    const existing = await this.requests.findById(id);
    if (!existing) throw FundRequestError.notFound(id);
    if (existing.estado === "EJECUTADA") throw FundRequestError.alreadyExecuted();
    if (existing.estado !== "APROBADA") throw FundRequestError.notApproved();

    // Generar movimiento de reabastecimiento/transferencia
    // Si el destino es una caja, buscar su sesión abierta
    if (existing.destinoScope === "CAJA") {
      const sesionDestino = await this.sessions.findOpenByCajaId(existing.destinoId);

      if (sesionDestino) {
        await this.movements.create(
          {
            tipo: "INGRESO",
            medio: "TRANSFERENCIA",
            monto: roundMoney(existing.monto),
            moneda: existing.moneda,
            referencia: `SOL-${existing.id}`,
            observacion: `Ejecución de solicitud de fondos: ${existing.motivo}`,
            cajaId: existing.destinoId,
            sesionCajaId: sesionDestino.id,
            cajaDestinoId: existing.destinoId,
          },
          ejecutadaPor
        );
      }
    }

    // Si el origen es una caja, generar egreso
    if (existing.origenScope === "CAJA") {
      const sesionOrigen = await this.sessions.findOpenByCajaId(existing.origenId);

      if (sesionOrigen) {
        await this.movements.create(
          {
            tipo: "EGRESO",
            medio: "TRANSFERENCIA",
            monto: roundMoney(existing.monto),
            moneda: existing.moneda,
            referencia: `SOL-${existing.id}`,
            observacion: `Ejecución de solicitud de fondos: ${existing.motivo}`,
            cajaId: existing.origenId,
            sesionCajaId: sesionOrigen.id,
            cajaOrigenId: existing.origenId,
          },
          ejecutadaPor
        );
      }
    }

    const executed = await this.requests.execute(id);
    if (!executed) throw FundRequestError.notFound(id);

    await this.audit.log({
      usuarioId: ejecutadaPor,
      accion: "SOLICITUD_EJECUTADA",
      entidadTipo: "SOLICITUD",
      entidadId: id,
      resumen: `Solicitud ejecutada. Monto: ${existing.monto} transferido de ${existing.origenScope}:${existing.origenId} a ${existing.destinoScope}:${existing.destinoId}`,
      beforeJson: JSON.stringify({ estado: "APROBADA" }),
      afterJson: JSON.stringify({ estado: "EJECUTADA" }),
    });

    return executed;
  }

  async getById(id: string): Promise<FundRequestRecord> {
    const request = await this.requests.findById(id);
    if (!request) throw FundRequestError.notFound(id);
    return request;
  }

  async list(filters: ListFundRequestsQuery): Promise<FundRequestRecord[]> {
    return this.requests.list(filters);
  }

  async getApproval(solicitudId: string): Promise<ApprovalRecord> {
    const request = await this.requests.findById(solicitudId);
    if (!request) throw FundRequestError.notFound(solicitudId);

    const approval = await this.requests.findApprovalByRequestId(solicitudId);
    if (!approval) throw FundRequestError.notFound(solicitudId);

    return approval;
  }
}
