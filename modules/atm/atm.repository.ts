import { AtmRecord, DepositDto, WithdrawDto } from "./atm.dto";

export interface AtmRepository {
  findById(id: string): Promise<AtmRecord | null>;
  deposit(id: string, dto: DepositDto): Promise<AtmRecord>;
  withdraw(id: string, dto: WithdrawDto): Promise<AtmRecord | null>; // ← aquí debe permitir null
}