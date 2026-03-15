// modules/audit/audit.postgres-repository.ts

import { query } from "../../db";
import {
  AuditEventRecord,
  CreateAuditEventDto,
  ListAuditEventsQuery,
} from "./audit.dto";
import { AuditRepository } from "./audit.repository";

// ── Tipos internos ───────────────────────────────────────

type AuditRow = {
  id: string;
  fecha: string;
  usuario_id: string;
  accion: string;
  entidad_tipo: string;
  entidad_id: string;
  resumen: string | null;
  metadata: string | null;
  before_json: string | null;
  after_json: string | null;
};

// ── Constantes SQL ───────────────────────────────────────

const AUDIT_SELECT = `
  select
    id::text as id,
    fecha,
    usuario_id::text as usuario_id,
    accion,
    entidad_tipo,
    entidad_id::text as entidad_id,
    resumen,
    metadata,
    before_json,
    after_json
  from eventoauditoria
`;

// ── Repositorio ──────────────────────────────────────────

export class PgAuditRepository implements AuditRepository {
  async create(dto: CreateAuditEventDto): Promise<AuditEventRecord> {
    const { rows } = await query<AuditRow>(
      `insert into eventoauditoria
        (fecha, usuario_id, accion, entidad_tipo, entidad_id, resumen, metadata, before_json, after_json)
       values (now(), $1, $2, $3, $4, $5, $6, $7, $8)
       returning
         id::text as id, fecha,
         usuario_id::text as usuario_id,
         accion, entidad_tipo,
         entidad_id::text as entidad_id,
         resumen, metadata, before_json, after_json`,
      [
        dto.usuarioId,
        dto.accion,
        dto.entidadTipo,
        dto.entidadId,
        dto.resumen ?? null,
        dto.metadata ?? null,
        dto.beforeJson ?? null,
        dto.afterJson ?? null,
      ]
    );

    return this.toRecord(rows[0]);
  }

  async findById(id: string): Promise<AuditEventRecord | null> {
    const { rows } = await query<AuditRow>(
      `${AUDIT_SELECT} where id = $1 limit 1`,
      [id]
    );

    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async list(filters: ListAuditEventsQuery): Promise<AuditEventRecord[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (filters.usuarioId) {
      conditions.push(`usuario_id = $${idx++}`);
      values.push(filters.usuarioId);
    }

    if (filters.accion) {
      conditions.push(`accion = $${idx++}`);
      values.push(filters.accion);
    }

    if (filters.entidadTipo) {
      conditions.push(`entidad_tipo = $${idx++}`);
      values.push(filters.entidadTipo);
    }

    if (filters.entidadId) {
      conditions.push(`entidad_id = $${idx++}`);
      values.push(filters.entidadId);
    }

    if (filters.desde) {
      conditions.push(`fecha >= $${idx++}`);
      values.push(filters.desde);
    }

    if (filters.hasta) {
      conditions.push(`fecha <= $${idx++}`);
      values.push(filters.hasta);
    }

    const where = conditions.length > 0
      ? `where ${conditions.join(" and ")}`
      : "";

    const { rows } = await query<AuditRow>(
      `${AUDIT_SELECT} ${where} order by fecha desc`,
      values
    );

    return rows.map((row) => this.toRecord(row));
  }

  // ── Privados ──────────────────────────────────────────

  private toRecord(row: AuditRow): AuditEventRecord {
    return {
      id: row.id,
      fecha: row.fecha,
      usuarioId: row.usuario_id,
      accion: row.accion,
      entidadTipo: row.entidad_tipo,
      entidadId: row.entidad_id,
      resumen: row.resumen,
      metadata: row.metadata,
      beforeJson: row.before_json,
      afterJson: row.after_json,
    };
  }
}
