import { CreateTreasuryDto, TreasuryRecord, UpdateTreasuryDto } from "./treasury.dto";

export interface TreasuryRepository {
  create(dto: CreateTreasuryDto): Promise<TreasuryRecord>;
  findById(id: string): Promise<TreasuryRecord | null>;
  findByCode(codigo: string): Promise<TreasuryRecord | null>;
  list(): Promise<TreasuryRecord[]>;
  update(id: string, dto: UpdateTreasuryDto): Promise<TreasuryRecord | null>;
  delete(id: string): Promise<boolean>;
}