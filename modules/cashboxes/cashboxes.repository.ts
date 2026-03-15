// modules/cashboxes/cashboxes.repository.ts

import {
  CashboxRecord,
  CreateCashboxDto,
  UpdateCashboxDto,
} from "./cashboxes.dto";

export interface CashboxRepository {
  create(dto: CreateCashboxDto): Promise<CashboxRecord>;
  findById(id: string): Promise<CashboxRecord | null>;
  findByCode(codigo: string): Promise<CashboxRecord | null>;
  list(): Promise<CashboxRecord[]>;
  update(id: string, dto: UpdateCashboxDto): Promise<CashboxRecord | null>;
  delete(id: string): Promise<boolean>;
}
