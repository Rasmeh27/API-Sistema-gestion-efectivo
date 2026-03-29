// modules/sucursales/sucursales.repository.ts

import {
  CreateSucursalDto,
  SucursalRecord,
  UpdateSucursalDto,
} from "./sucursales.dto";
import { AtmRecord } from "../atm/atm.dto";

export interface SucursalRepository {
  create(dto: CreateSucursalDto): Promise<SucursalRecord>;
  findById(id: string): Promise<SucursalRecord | null>;
  findByCode(codigo: string): Promise<SucursalRecord | null>;
  list(): Promise<SucursalRecord[]>;
  update(id: string, dto: UpdateSucursalDto): Promise<SucursalRecord | null>;
  delete(id: string): Promise<boolean>;
  countByCodePrefix(prefix: string): Promise<number>;
  listAtms(sucursalId: string): Promise<AtmRecord[]>;
  hasOperationalRelations(id: string): Promise<boolean>;
  syncStoredTotal(id: string): Promise<number>;
}
