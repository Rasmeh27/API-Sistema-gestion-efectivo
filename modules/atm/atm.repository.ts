// modules/atm/atm.repository.ts

import {
  AtmMovimientoRecord,
  AtmOperationResult,
  AtmRecord,
  CreateAtmDto,
  DepositDto,
  WithdrawDto,
} from "./atm.dto";

export interface AtmRepository {
  create(dto: CreateAtmDto): Promise<AtmRecord>;
  findById(id: string): Promise<AtmRecord | null>;
  findByCode(codigo: string): Promise<AtmRecord | null>;
  findByCashbox(cajaId: string): Promise<AtmRecord | null>;
  deposit(id: string, dto: DepositDto, usuarioId: string): Promise<AtmOperationResult>;
  withdraw(id: string, dto: WithdrawDto, usuarioId: string): Promise<AtmOperationResult>;
  getMovimientos(atmId: string): Promise<AtmMovimientoRecord[]>;
  countByCodePrefix(prefix: string): Promise<number>;
  getSucursalCodigo(sucursalId: string): Promise<string | null>;
}
