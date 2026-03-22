// modules/fund-requests/fund-requests.postgres-repository.ts

import { query } from "../../db";
import {
  FundRequestRecord,
  ApprovalRecord,
  CreateFundRequestDto,
  ResolveRequestDto,
  ListFundRequestsQuery,
  RequestStatus,
  Decision,
  Priority,
} from "./fund-requests.dto";
import { FundRequestRepository } from "./fund-requests.repository";

// ── Tipos internos ───────────────────────────────────────

type RequestRow = {
  id: string;
  origen_scope: string;
  origen_id: string;
  destino_scope: string;
  destino_id: string;
  monto: number;
  moneda: string;
  motivo: string;
  prioridad: Priority;
  estado: RequestStatus;
  solicitada_por: string;
  fecha_solicitud: string;
  aprobada_por: string | null;
  fecha_aprobacion: string | null;
  motivo_rechazo: string | null;
};

type ApprovalRow = {
  id: string;
  solicitud_id: string;
  usuario_id: string;
  decision: Decision;
  comentario: string | null;
  fecha: string;
};

// ── Constantes SQL ───────────────────────────────────────

const REQUEST_SELECT = `
  select
    id::text as id,
    origen_scope, origen_id::text as origen_id,
    destino_scope, destino_id::text as destino_id,
    monto, moneda, motivo, prioridad, estado,
    solicitada_por::text as solicitada_por,
    fecha_solicitud,
    aprobada_por::text as aprobada_por,
    fecha_aprobacion,
    motivo_rechazo
  from solicitudfondos
`;

const APPROVAL_SELECT = `
  select
    id::text as id,
    solicitud_id::text as solicitud_id,
    usuario_id::text as usuario_id,
    decision, comentario, fecha
  from aprobacionsolicitud
`;

// ── Repositorio ──────────────────────────────────────────

export class PgFundRequestRepository implements FundRequestRepository {
  async create(
    dto: CreateFundRequestDto,
    solicitadaPor: string
  ): Promise<FundRequestRecord> {
    const { rows } = await query<RequestRow>(
      `insert into solicitudfondos
        (origen_scope, origen_id, destino_scope, destino_id,
         monto, moneda, motivo, prioridad, estado, solicitada_por, fecha_solicitud)
       values ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDIENTE', $9, now())
       returning
         id::text as id, origen_scope, origen_id::text as origen_id,
         destino_scope, destino_id::text as destino_id,
         monto, moneda, motivo, prioridad, estado,
         solicitada_por::text as solicitada_por, fecha_solicitud,
         aprobada_por::text as aprobada_por, fecha_aprobacion, motivo_rechazo`,
      [
        dto.origenScope, dto.origenId,
        dto.destinoScope, dto.destinoId,
        dto.monto, dto.moneda ?? "DOP", dto.motivo,
        dto.prioridad ?? "MEDIA",
        solicitadaPor,
      ]
    );

    return this.toRequestRecord(rows[0]);
  }

  async findById(id: string): Promise<FundRequestRecord | null> {
    const { rows } = await query<RequestRow>(
      `${REQUEST_SELECT} where id = $1 limit 1`,
      [id]
    );

    return rows[0] ? this.toRequestRecord(rows[0]) : null;
  }

  async list(filters: ListFundRequestsQuery): Promise<FundRequestRecord[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (filters.origenScope) {
      conditions.push(`origen_scope = $${idx++}`);
      values.push(filters.origenScope);
    }

    if (filters.origenId) {
      conditions.push(`origen_id = $${idx++}`);
      values.push(filters.origenId);
    }

    if (filters.estado) {
      conditions.push(`estado = $${idx++}`);
      values.push(filters.estado);
    }

    if (filters.prioridad) {
      conditions.push(`prioridad = $${idx++}`);
      values.push(filters.prioridad);
    }

    const where = conditions.length > 0
      ? `where ${conditions.join(" and ")}`
      : "";

    const { rows } = await query<RequestRow>(
      `${REQUEST_SELECT} ${where} order by fecha_solicitud desc`,
      values
    );

    return rows.map((row) => this.toRequestRecord(row));
  }

  async resolve(
    id: string,
    dto: ResolveRequestDto,
    aprobadaPor: string
  ): Promise<FundRequestRecord | null> {
    const motivoRechazo = dto.decision === "RECHAZADA"
      ? (dto.motivoRechazo ?? dto.comentario ?? null)
      : null;

    const { rowCount } = await query(
      `update solicitudfondos
       set estado = $1,
           aprobada_por = $2,
           fecha_aprobacion = now(),
           motivo_rechazo = $3
       where id = $4 and estado = 'PENDIENTE'`,
      [dto.decision, aprobadaPor, motivoRechazo, id]
    );

    if ((rowCount ?? 0) === 0) return null;

    return this.findById(id);
  }

  async execute(id: string): Promise<FundRequestRecord | null> {
    const { rowCount } = await query(
      `update solicitudfondos
       set estado = 'EJECUTADA'
       where id = $1 and estado = 'APROBADA'`,
      [id]
    );

    if ((rowCount ?? 0) === 0) return null;

    return this.findById(id);
  }

  async createApproval(
    solicitudId: string,
    dto: ResolveRequestDto,
    usuarioId: string
  ): Promise<ApprovalRecord> {
    const { rows } = await query<ApprovalRow>(
      `insert into aprobacionsolicitud
        (solicitud_id, usuario_id, decision, comentario, fecha)
       values ($1, $2, $3, $4, now())
       returning
         id::text as id, solicitud_id::text as solicitud_id,
         usuario_id::text as usuario_id,
         decision, comentario, fecha`,
      [solicitudId, usuarioId, dto.decision, dto.comentario ?? null]
    );

    return this.toApprovalRecord(rows[0]);
  }

  async findApprovalByRequestId(solicitudId: string): Promise<ApprovalRecord | null> {
    const { rows } = await query<ApprovalRow>(
      `${APPROVAL_SELECT} where solicitud_id = $1 limit 1`,
      [solicitudId]
    );

    return rows[0] ? this.toApprovalRecord(rows[0]) : null;
  }

  // ── Privados ──────────────────────────────────────────

  private toRequestRecord(row: RequestRow): FundRequestRecord {
    return {
      id: row.id,
      origenScope: row.origen_scope,
      origenId: row.origen_id,
      destinoScope: row.destino_scope,
      destinoId: row.destino_id,
      monto: row.monto,
      moneda: row.moneda ?? "DOP",
      motivo: row.motivo,
      prioridad: row.prioridad,
      estado: row.estado,
      solicitadaPor: row.solicitada_por,
      fechaSolicitud: row.fecha_solicitud,
      aprobadaPor: row.aprobada_por,
      fechaAprobacion: row.fecha_aprobacion,
      motivoRechazo: row.motivo_rechazo,
    };
  }

  private toApprovalRecord(row: ApprovalRow): ApprovalRecord {
    return {
      id: row.id,
      solicitudId: row.solicitud_id,
      usuarioId: row.usuario_id,
      decision: row.decision,
      comentario: row.comentario,
      fecha: row.fecha,
    };
  }
}
