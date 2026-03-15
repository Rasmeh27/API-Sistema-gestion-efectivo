// modules/cash-movements/cash-movements.repository.ts

import {
  CashMovementRecord,
  CreateMovementDto,
  ListMovementsQuery,
} from "./cash-movements.dto";

export interface CashMovementRepository {
  create(dto: CreateMovementDto, usuarioId: string): Promise<CashMovementRecord>;
  findById(id: string): Promise<CashMovementRecord | null>;
  list(filters: ListMovementsQuery): Promise<CashMovementRecord[]>;
  sumBySession(sesionCajaId: string): Promise<{ ingresos: number; egresos: number }>;
}
