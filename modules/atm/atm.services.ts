// modules/atm/atm.service.ts

import {
  AtmMovimientoRecord,
  AtmOperationResult,
  AtmRecord,
  CreateAtmDto,
  DepositDto,
  WithdrawDto,
} from "./atm.dto";
import { AtmError } from "./atm.errors";
import { AtmRepository } from "./atm.repository";
import { AuditLogger } from "../audit/audit.logger";

export class AtmService {
  constructor(
    private readonly repository: AtmRepository,
    private readonly audit: AuditLogger
  ) {}

  async create(dto: CreateAtmDto, usuarioId: string): Promise<AtmRecord> {
    if (dto.balanceInicial <= 0) {
      throw AtmError.invalidAmount();
    }

    if (!dto.codigo) {
      dto.codigo = await this.generateUniqueCode(dto.sucursalId);
    }

    const created = await this.repository.create(dto);

    await this.audit.log({
      usuarioId,
      accion: "ATM_CREADO",
      entidadTipo: "ATM",
      entidadId: created.id,
      resumen: `ATM ${created.codigo} creado con balance inicial de ${created.balanceActual} ${created.moneda}`,
      metadata: JSON.stringify({
        sucursalId: created.sucursalId,
        cajaId: created.cajaId,
      }),
    });

    return created;
  }

  async getById(id: string): Promise<AtmRecord> {
    const atm = await this.repository.findById(id);
    if (!atm) {
      throw AtmError.notFound(id);
    }
    return atm;
  }

  async getMovimientos(id: string): Promise<AtmMovimientoRecord[]> {
    const atm = await this.repository.findById(id);
    if (!atm) {
      throw AtmError.notFound(id);
    }
    return this.repository.getMovimientos(id);
  }

  async deposit(id: string, dto: DepositDto, usuarioId: string): Promise<AtmOperationResult> {
    if (dto.monto <= 0) {
      throw AtmError.invalidAmount();
    }

    const result = await this.repository.deposit(id, dto, usuarioId);

    await this.audit.log({
      usuarioId,
      accion: "ATM_REABASTECIDO",
      entidadTipo: "ATM",
      entidadId: id,
      resumen: `ATM ${result.atm.codigo} reabastecido por ${dto.monto} ${result.atm.moneda}`,
      metadata: JSON.stringify({
        movimientoId: result.movimiento.id,
        sesionCajaId: dto.sesionCajaId,
        sucursalId: result.atm.sucursalId,
      }),
    });

    return result;
  }

  async withdraw(id: string, dto: WithdrawDto, usuarioId: string): Promise<AtmOperationResult> {
    if (dto.monto <= 0) {
      throw AtmError.invalidAmount();
    }

    const result = await this.repository.withdraw(id, dto, usuarioId);

    await this.audit.log({
      usuarioId,
      accion: "ATM_RETIRO_REGISTRADO",
      entidadTipo: "ATM",
      entidadId: id,
      resumen: `ATM ${result.atm.codigo} retiró ${dto.monto} ${result.atm.moneda}`,
      metadata: JSON.stringify({
        movimientoId: result.movimiento.id,
        sesionCajaId: dto.sesionCajaId,
        sucursalId: result.atm.sucursalId,
      }),
    });

    return result;
  }

  private async generateUniqueCode(sucursalId: string): Promise<string> {
    const sucursalCodigo = await this.repository.getSucursalCodigo(sucursalId);
    const prefix = `ATM-${sucursalCodigo ?? "GEN"}-`;
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const count = await this.repository.countByCodePrefix(prefix);
      const next = count + 1 + attempt;
      const candidate = `${prefix}${String(next).padStart(3, "0")}`;
      const existing = await this.repository.findByCode(candidate);
      if (!existing) return candidate;
    }

    const fallback = `${prefix}${Date.now()}`;
    return fallback;
  }
}
