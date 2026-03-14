import { CreateCashboxDto, CashboxRecord, UpdateCashboxDto } from "./cashboxes.dto";

export interface CashboxRepository {
  create(dto: CreateCashboxDto): Promise<CashboxRecord>;
  findById(id: string): Promise<CashboxRecord | null>;
  findByCode(code: string): Promise<CashboxRecord | null>;
  findAll(): Promise<CashboxRecord[]>;
  update(id: string, dto: UpdateCashboxDto): Promise<CashboxRecord | null>;
  delete(id: string): Promise<boolean>;
  isAssignedToSucursal(id: string): Promise<boolean>;
}