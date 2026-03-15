// modules/cashbox-sessions/cashbox-sessions.repository.ts

import {
  CashboxSessionRecord,
  CashboxSessionStatus,
  OpenSessionDto,
} from "./cashbox-sessions.dto";

export interface CashboxSessionRepository {
  create(
    dto: OpenSessionDto & { usuarioAperturaId: string; fechaApertura: string }
  ): Promise<CashboxSessionRecord>;

  findById(id: string): Promise<CashboxSessionRecord | null>;

  findOpenByCajaId(cajaId: string): Promise<CashboxSessionRecord | null>;

  close(
    id: string,
    data: {
      usuarioCierreId: string;
      fechaCierre: string;
      saldoFinalEsperado: number;
      saldoFinalReal: number;
      diferencia: number;
    }
  ): Promise<CashboxSessionRecord | null>;

  list(
    offset: number,
    limit: number,
    cajaId?: string,
    estado?: CashboxSessionStatus
  ): Promise<{ items: CashboxSessionRecord[]; total: number }>;
}
