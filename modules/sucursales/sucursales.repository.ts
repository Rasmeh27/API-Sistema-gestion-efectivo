import { CreateSucursalDto, SucursalRecord, UpdateSucursalDto } from "./sucursales.dto";

export interface SucursalRepository {
  create(dto: CreateSucursalDto): Promise<SucursalRecord>;
  findById(id: string): Promise<SucursalRecord | null>;
  findByCode(codigo: string): Promise<SucursalRecord | null>;
  list(): Promise<SucursalRecord[]>;
  update(id: string, dto: UpdateSucursalDto): Promise<SucursalRecord | null>;
  delete(id: string): Promise<boolean>;
}