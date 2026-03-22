// modules/atm/atm.service.ts

import { AtmRecord, DepositDto, WithdrawDto } from "./atm.dto";
import { AtmError } from "./atm.errors";
import { AtmRepository } from "./atm.repository";
import { CashMovementsService } from "../cash-movements/cash-movements.service";
import { SucursalesService } from "../sucursales/sucursales.service";

export class AtmService {
  constructor(
    private readonly repository: AtmRepository,
    private readonly cashMovements: CashMovementsService,
    private readonly sucursalesService: SucursalesService   // ← nuevo
  ) {}

  async getById(id: string): Promise<AtmRecord> {
    const atm = await this.repository.findById(id);
    if (!atm) throw AtmError.notFound(id);
    return atm;
  }

  async deposit(
    id: string,
    dto: DepositDto,
    usuarioId: string,
    sesionCajaId: string
  ): Promise<AtmRecord> {
    if (dto.monto <= 0) throw AtmError.invalidAmount();
    const atm = await this.repository.deposit(id, dto);
    if (!atm) throw AtmError.notFound(id);

    // Registrar movimiento en cash-movements
    await this.cashMovements.create({
      tipo: "INGRESO",
      medio: "ATM",
      monto: dto.monto,
      moneda: atm.moneda,
      referencia: `DEPÓSITO ATM ${atm.codigo}`,
      observacion: dto.motivo,
      cajaId: atm.cajaId,
      sesionCajaId,
    }, usuarioId);

    // 🔑 Actualizar total de la sucursal
    await this.sucursalesService.getTotalSucursal(atm.sucursalId);

    return atm;
  }

  async withdraw(
    id: string,
    dto: WithdrawDto,
    usuarioId: string,
    sesionCajaId: string
  ): Promise<AtmRecord> {
    if (dto.monto <= 0) throw AtmError.invalidAmount();
    const atm = await this.repository.withdraw(id, dto);
    if (!atm) throw AtmError.insufficientFunds();

    // Registrar movimiento en cash-movements
    await this.cashMovements.create({
      tipo: "EGRESO",
      medio: "ATM",
      monto: dto.monto,
      moneda: atm.moneda,
      referencia: `RETIRO ATM ${atm.codigo}`,
      observacion: dto.motivo,
      cajaId: atm.cajaId,
      sesionCajaId,
    }, usuarioId);

    // 🔑 Actualizar total de la sucursal
    await this.sucursalesService.getTotalSucursal(atm.sucursalId);

    return atm;
  }
}