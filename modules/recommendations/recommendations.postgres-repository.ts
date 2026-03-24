// modules/recommendations/recommendations.postgres-repository.ts

import { query } from "../../db";
import {
  RecommendationRecord,
  CreateRecommendationDto,
  UpdateRecommendationDto,
  ListRecommendationsQuery,
  RecommendationType,
  RecommendationPriority,
  RecommendationStatus,
} from "./recommendations.dto";
import { RecommendationRepository } from "./recommendations.repository";

// ── Tipos internos ───────────────────────────────────────

type RecommendationRow = {
  id: string;
  tipo: RecommendationType;
  prioridad: RecommendationPriority;
  titulo: string;
  descripcion: string;
  datos_contexto: Record<string, unknown> | string;
  estado: RecommendationStatus;
  sucursal_id: string | null;
  created_at: string;
  updated_at: string;
};

// ── Constantes SQL ───────────────────────────────────────

const REC_SELECT = `
  select
    id::text as id,
    tipo,
    prioridad,
    titulo,
    descripcion,
    datos_contexto,
    estado,
    sucursal_id::text as sucursal_id,
    created_at,
    updated_at
  from recomendacion
`;

// ── Repositorio ──────────────────────────────────────────

export class PgRecommendationRepository implements RecommendationRepository {
  async create(dto: CreateRecommendationDto): Promise<RecommendationRecord> {
    const { rows } = await query<RecommendationRow>(
      `insert into recomendacion (tipo, prioridad, titulo, descripcion, datos_contexto, sucursal_id)
       values ($1, $2, $3, $4, $5, $6)
       returning
         id::text as id, tipo, prioridad, titulo, descripcion,
         datos_contexto, estado, sucursal_id::text as sucursal_id,
         created_at, updated_at`,
      [
        dto.tipo,
        dto.prioridad,
        dto.titulo,
        dto.descripcion,
        JSON.stringify(dto.datosContexto ?? {}),
        dto.sucursalId ?? null,
      ]
    );

    return this.toRecord(rows[0]);
  }

  async createMany(dtos: CreateRecommendationDto[]): Promise<RecommendationRecord[]> {
    const results: RecommendationRecord[] = [];
    for (const dto of dtos) {
      results.push(await this.create(dto));
    }
    return results;
  }

  async findById(id: string): Promise<RecommendationRecord | null> {
    const { rows } = await query<RecommendationRow>(
      `${REC_SELECT} where id = $1 limit 1`,
      [id]
    );

    return rows[0] ? this.toRecord(rows[0]) : null;
  }

  async list(filters: ListRecommendationsQuery): Promise<RecommendationRecord[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (filters.tipo) {
      conditions.push(`tipo = $${idx++}`);
      values.push(filters.tipo);
    }

    if (filters.estado) {
      conditions.push(`estado = $${idx++}`);
      values.push(filters.estado);
    }

    if (filters.prioridad) {
      conditions.push(`prioridad = $${idx++}`);
      values.push(filters.prioridad);
    }

    if (filters.sucursalId) {
      conditions.push(`sucursal_id = $${idx++}`);
      values.push(filters.sucursalId);
    }

    const where = conditions.length > 0
      ? `where ${conditions.join(" and ")}`
      : "";

    const limit = filters.limit ?? 50;
    values.push(limit);

    const { rows } = await query<RecommendationRow>(
      `${REC_SELECT} ${where} order by created_at desc limit $${idx}`,
      values
    );

    return rows.map((row) => this.toRecord(row));
  }

  async update(
    id: string,
    dto: UpdateRecommendationDto
  ): Promise<RecommendationRecord | null> {
    const { rowCount } = await query(
      `update recomendacion set estado = $1, updated_at = now() where id = $2`,
      [dto.estado, id]
    );

    if ((rowCount ?? 0) === 0) return null;

    return this.findById(id);
  }

  // ── Privados ──────────────────────────────────────────

  private toRecord(row: RecommendationRow): RecommendationRecord {
    const datosContexto =
      typeof row.datos_contexto === "string"
        ? JSON.parse(row.datos_contexto)
        : row.datos_contexto;

    return {
      id: row.id,
      tipo: row.tipo,
      prioridad: row.prioridad,
      titulo: row.titulo,
      descripcion: row.descripcion,
      datosContexto: datosContexto,
      estado: row.estado,
      sucursalId: row.sucursal_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
