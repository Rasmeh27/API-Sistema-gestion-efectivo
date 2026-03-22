// modules/audit/audit.logger.ts

import { AuditRepository } from "./audit.repository";
import { CreateAuditEventDto } from "./audit.dto";

/**
 * Helper ligero para que cualquier service emita eventos de auditoría
 * sin depender directamente del módulo de auditoría.
 * Errores de auditoría NUNCA rompen el flujo principal (fire-and-forget).
 */
export class AuditLogger {
  constructor(private readonly repo: AuditRepository) {}

  async log(event: CreateAuditEventDto): Promise<void> {
    try {
      await this.repo.create(event);
    } catch {
      // Auditoría no debe romper operaciones de negocio
      console.error("[AuditLogger] Error registrando evento:", event.accion);
    }
  }
}
