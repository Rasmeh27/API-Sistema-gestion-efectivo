// modules/recommendations/recommendations.service.ts
//
// Orquesta todo: context builder → LLM → repository.

import {
  RecommendationRecord,
  CreateRecommendationDto,
  UpdateRecommendationDto,
  ListRecommendationsQuery,
  ChatMessageDto,
  ChatResponse,
  RecommendationType,
  RecommendationPriority,
} from "./recommendations.dto";
import { RecommendationError } from "./recommendations.errors";
import { RecommendationRepository } from "./recommendations.repository";
import { LlmService } from "./recommendations.llm-service";
import { ContextBuilder } from "./recommendations.context-builder";

export class RecommendationsService {
  constructor(
    private readonly repository: RecommendationRepository,
    private readonly llm: LlmService,
    private readonly contextBuilder: ContextBuilder
  ) {}

  // ── Generate (POST /recomendaciones/generate) ─────────

  async generate(sucursalId?: string): Promise<RecommendationRecord[]> {
    const context = await this.contextBuilder.buildContext(sucursalId);
    const contextText = this.contextBuilder.formatContextForPrompt(context);
    const systemPrompt = this.contextBuilder.getGenerateSystemPrompt();

    const userMessage = `Analiza los siguientes datos del sistema y genera recomendaciones:\n\n${contextText}`;

    const rawResponse = await this.llm.complete(systemPrompt, userMessage);

    const recommendations = this.parseGeneratedRecommendations(rawResponse);

    const dtos: CreateRecommendationDto[] = recommendations.map((rec) => ({
      tipo: rec.tipo,
      prioridad: rec.prioridad,
      titulo: rec.titulo,
      descripcion: rec.descripcion,
      datosContexto: context as unknown as Record<string, unknown>,
      sucursalId,
    }));

    return this.repository.createMany(dtos);
  }

  // ── List (GET /recomendaciones) ────────────────────────

  async list(filters: ListRecommendationsQuery): Promise<RecommendationRecord[]> {
    return this.repository.list(filters);
  }

  // ── GetById (GET /recomendaciones/:id) ─────────────────

  async getById(id: string): Promise<RecommendationRecord> {
    const record = await this.repository.findById(id);
    if (!record) throw RecommendationError.notFound(id);
    return record;
  }

  // ── Update (PATCH /recomendaciones/:id) ────────────────

  async update(id: string, dto: UpdateRecommendationDto): Promise<RecommendationRecord> {
    const updated = await this.repository.update(id, dto);
    if (!updated) throw RecommendationError.notFound(id);
    return updated;
  }

  // ── Chat (POST /recomendaciones/chat) ──────────────────

  async chat(dto: ChatMessageDto): Promise<ChatResponse> {
    const context = await this.contextBuilder.buildContext(dto.sucursalId);
    const contextText = this.contextBuilder.formatContextForPrompt(context);
    const systemPrompt = this.contextBuilder.getChatSystemPrompt();

    const userMessage = `CONTEXTO DEL SISTEMA:\n${contextText}\n\n---\n\nPREGUNTA DEL USUARIO:\n${dto.message}`;

    const reply = await this.llm.complete(systemPrompt, userMessage);

    return {
      reply,
      context: {
        cashSummary: context.cashSummary,
        cajasAbiertas: context.cashSummary.cajasAbiertas,
        efectivoTotal: context.cashSummary.efectivoTotalEnCirculacion,
      },
    };
  }

  // ── Privados ──────────────────────────────────────────

  private parseGeneratedRecommendations(
    raw: string
  ): { tipo: RecommendationType; prioridad: RecommendationPriority; titulo: string; descripcion: string }[] {
    try {
      // Extraer JSON del texto (el LLM puede envolver el JSON con texto)
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No se encontró array JSON en la respuesta");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(parsed)) {
        throw new Error("La respuesta no es un array");
      }

      const validTypes: RecommendationType[] = ["ALERTA", "OPTIMIZACION", "PREVISION", "GENERAL"];
      const validPriorities: RecommendationPriority[] = ["ALTA", "MEDIA", "BAJA"];

      return parsed
        .filter(
          (item: unknown) =>
            item &&
            typeof item === "object" &&
            typeof (item as Record<string, unknown>).titulo === "string" &&
            typeof (item as Record<string, unknown>).descripcion === "string"
        )
        .map((item: Record<string, unknown>) => {
          const tipo = String(item.tipo ?? "GENERAL").toUpperCase() as RecommendationType;
          const prioridad = String(item.prioridad ?? "MEDIA").toUpperCase() as RecommendationPriority;

          return {
            tipo: validTypes.includes(tipo) ? tipo : "GENERAL",
            prioridad: validPriorities.includes(prioridad) ? prioridad : "MEDIA",
            titulo: String(item.titulo).slice(0, 255),
            descripcion: String(item.descripcion),
          };
        })
        .slice(0, 10); // máximo 10 recomendaciones
    } catch {
      // Si falla el parsing, crear una recomendación genérica con la respuesta del LLM
      return [
        {
          tipo: "GENERAL" as RecommendationType,
          prioridad: "MEDIA" as RecommendationPriority,
          titulo: "Análisis del sistema",
          descripcion: raw.slice(0, 1000),
        },
      ];
    }
  }
}
