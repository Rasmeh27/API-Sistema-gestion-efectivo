// modules/atm/atm.postgres-repository.ts

import { PoolClient } from "pg";
import { query, withTransaction } from "../../db";
import {
  AtmMovimientoRecord,
  AtmOperationDto,
  AtmOperationResult,
  AtmRecord,
  CreateAtmDto,
  DepositDto,
  WithdrawDto,
} from "./atm.dto";
import { AtmRepository } from "./atm.repository";
import { AtmError } from "./atm.errors";

type AtmDetailRow = {
  id: string;
  sucursal_id: string;
  sucursal_codigo: string;
  sucursal_nombre: string;
  caja_id: string;
  caja_codigo: string | null;
  caja_nombre: string | null;
  codigo: string;
  nombre: string;
  estado: string;
  moneda: string;
  limite_operativo: string;
  saldo_actual: string;
};

type SessionRow = {
  id: string;
  caja_id: string;
  estado: string;
  saldo_inicial: string;
};

type SessionTotalsRow = {
  ingresos: string;
  egresos: string;
};

type MovementDetailRow = {
  id: string;
  fecha: string;
  tipo: string;
  medio: string;
  monto: string;
  moneda: string;
  referencia: string | null;
  observacion: string | null;
  estado: string;
  usuario_id: string;
  usuario_nombre: string | null;
  sesion_caja_id: string;
  caja_id: string;
  caja_codigo: string | null;
  atm_id: string;
  atm_codigo: string;
  atm_nombre: string;
  sucursal_id: string;
  sucursal_codigo: string;
  sucursal_nombre: string;
};

type CashboxContextRow = {
  id: string;
  sucursal_id: string;
  codigo: string;
  nombre: string;
  moneda: string | null;
};

const ATM_SELECT = `
  select
    a.id::text as id,
    a.sucursal_id::text as sucursal_id,
    s.codigo as sucursal_codigo,
    s.nombre as sucursal_nombre,
    a.caja_id::text as caja_id,
    c.codigo as caja_codigo,
    c.nombre as caja_nombre,
    a.codigo,
    a.nombre,
    a.estado,
    a.moneda,
    a.limite_operativo::text as limite_operativo,
    a.saldo_actual::text as saldo_actual
  from atm a
  join sucursal s on s.id = a.sucursal_id
  left join caja c on c.id = a.caja_id
`;

const ATM_MOVEMENT_SELECT = `
  select
    me.id::text as id,
    me.fecha::text as fecha,
    me.tipo,
    me.medio,
    me.monto::text as monto,
    me.moneda,
    me.referencia,
    me.observacion,
    me.estado,
    u.id::text as usuario_id,
    u.nombre as usuario_nombre,
    me.sesion_caja_id::text as sesion_caja_id,
    me.caja_id::text as caja_id,
    c.codigo as caja_codigo,
    a.id::text as atm_id,
    a.codigo as atm_codigo,
    a.nombre as atm_nombre,
    s.id::text as sucursal_id,
    s.codigo as sucursal_codigo,
    s.nombre as sucursal_nombre
  from movimientoefectivo me
  join atm a on a.id = me.atm_id
  join sucursal s on s.id = a.sucursal_id
  left join caja c on c.id = me.caja_id
  left join usuario u on u.id = me.usuario_id
`;

export class PgAtmRepository implements AtmRepository {
  async create(dto: CreateAtmDto): Promise<AtmRecord> {
    return withTransaction<AtmRecord>(async (client) => {
      const codigo = dto.codigo!;

      const existingByCode = await this.findByCodeInternal(client, codigo);
      if (existingByCode) {
        throw AtmError.codeConflict(codigo);
      }

      const existingByCashbox = await this.findByCashboxInternal(client, dto.cajaId);
      if (existingByCashbox) {
        throw AtmError.cashboxConflict(dto.cajaId, existingByCashbox.codigo);
      }

      const cashbox = await this.getCashboxContext(client, dto.cajaId);
      if (!cashbox) {
        throw AtmError.invalidContext("La caja seleccionada no existe o no está disponible");
      }

      if (cashbox.sucursal_id !== dto.sucursalId) {
        throw AtmError.invalidContext(
          "La caja seleccionada debe pertenecer a la misma sucursal del ATM"
        );
      }

      const initialBalance = Number(dto.balanceInicial);
      const moneda = dto.moneda ?? cashbox.moneda ?? "DOP";
      const estado = dto.estado ?? "ACTIVO";

      const { rows } = await client.query<{ id: string }>(
        `insert into atm
          (sucursal_id, caja_id, codigo, nombre, estado, moneda, limite_operativo, saldo_actual)
         values ($1, $2, $3, $4, $5, $6, $7, $7)
         returning id::text as id`,
        [
          dto.sucursalId,
          dto.cajaId,
          codigo,
          dto.nombre,
          estado,
          moneda,
          initialBalance,
        ]
      );

      const created = await this.getAtmForUpdate(client, rows[0].id);
      await this.syncSucursalTotal(client, dto.sucursalId);
      return this.toAtmRecord(created);
    });
  }

  async findById(id: string): Promise<AtmRecord | null> {
    const { rows } = await query<AtmDetailRow>(`${ATM_SELECT} where a.id = $1 limit 1`, [id]);
    return rows[0] ? this.toAtmRecord(rows[0]) : null;
  }

  async findByCode(codigo: string): Promise<AtmRecord | null> {
    const { rows } = await query<AtmDetailRow>(`${ATM_SELECT} where lower(a.codigo) = lower($1) limit 1`, [codigo]);
    return rows[0] ? this.toAtmRecord(rows[0]) : null;
  }

  async findByCashbox(cajaId: string): Promise<AtmRecord | null> {
    const { rows } = await query<AtmDetailRow>(`${ATM_SELECT} where a.caja_id = $1 limit 1`, [cajaId]);
    return rows[0] ? this.toAtmRecord(rows[0]) : null;
  }

  async deposit(id: string, dto: DepositDto, usuarioId: string): Promise<AtmOperationResult> {
    return this.executeMovement({
      atmId: id,
      dto,
      usuarioId,
      atmDelta: dto.monto,
      ledgerType: "EGRESO",
      defaultReferencePrefix: "ATM-REAB",
      defaultObservation: "Reabastecimiento de ATM",
      requiresSourceFunds: true,
    });
  }

  async withdraw(id: string, dto: WithdrawDto, usuarioId: string): Promise<AtmOperationResult> {
    return this.executeMovement({
      atmId: id,
      dto,
      usuarioId,
      atmDelta: -dto.monto,
      ledgerType: "INGRESO",
      defaultReferencePrefix: "ATM-RET",
      defaultObservation: "Retiro de efectivo desde ATM",
      requiresSourceFunds: false,
    });
  }

  async getMovimientos(atmId: string): Promise<AtmMovimientoRecord[]> {
    const atm = await this.findById(atmId);
    if (!atm) {
      throw AtmError.notFound(atmId);
    }

    const { rows } = await query<MovementDetailRow>(
      `${ATM_MOVEMENT_SELECT}
       where me.atm_id = $1
       order by me.fecha desc, me.id desc`,
      [atmId]
    );

    return rows.map((row) => this.toMovimientoRecord(row));
  }

  async countByCodePrefix(prefix: string): Promise<number> {
    const { rows } = await query<{ count: string }>(
      `select count(*)::text as count
       from atm
       where codigo like $1 || '%'`,
      [prefix]
    );
    return Number(rows[0]?.count ?? 0);
  }

  async getSucursalCodigo(sucursalId: string): Promise<string | null> {
    const { rows } = await query<{ codigo: string }>(
      `select codigo from sucursal where id = $1 limit 1`,
      [sucursalId]
    );
    return rows[0]?.codigo ?? null;
  }

  private async executeMovement(input: {
    atmId: string;
    dto: AtmOperationDto;
    usuarioId: string;
    atmDelta: number;
    ledgerType: "INGRESO" | "EGRESO";
    defaultReferencePrefix: string;
    defaultObservation: string;
    requiresSourceFunds: boolean;
  }): Promise<AtmOperationResult> {
    return withTransaction<AtmOperationResult>(async (client) => {
      const atm = await this.getAtmForUpdate(client, input.atmId);
      this.validateOperationContext(atm, input.dto);

      const session = await this.getSessionForUpdate(client, input.dto.sesionCajaId);
      if (!session) {
        throw AtmError.sessionNotFound(input.dto.sesionCajaId);
      }

      if (session.estado !== "ABIERTA") {
        throw AtmError.sessionNotOpen(session.id);
      }

      if (session.caja_id !== atm.caja_id) {
        throw AtmError.invalidContext(
          "La sesión de caja indicada no pertenece a la caja asociada al ATM"
        );
      }

      if (input.requiresSourceFunds) {
        const sessionBalance = await this.getSessionCurrentBalance(client, session.id);
        if (input.dto.monto > sessionBalance) {
          throw AtmError.invalidContext(
            "La caja asociada al ATM no tiene fondos suficientes para reabastecerlo"
          );
        }
      }

      const nextAtmBalance = Number(atm.saldo_actual) + input.atmDelta;
      if (nextAtmBalance < 0) {
        throw AtmError.insufficientFunds();
      }

      await client.query(
        `update atm
         set saldo_actual = $1
         where id = $2`,
        [nextAtmBalance, atm.id]
      );

      const reference =
        input.dto.referencia ?? `${input.defaultReferencePrefix}-${atm.codigo}-${Date.now()}`;
      const observation =
        input.dto.observacion ?? `${input.defaultObservation} (${atm.codigo})`;

      const movementId = await this.insertMovement(client, {
        tipo: input.ledgerType,
        monto: input.dto.monto,
        moneda: atm.moneda,
        referencia: reference,
        observacion: observation,
        cajaId: atm.caja_id,
        sesionCajaId: session.id,
        usuarioId: input.usuarioId,
        atmId: atm.id,
      });

      const updatedAtm = await this.getAtmForUpdate(client, atm.id);
      const movement = await this.loadMovementById(client, movementId);
      const sucursalTotal = await this.syncSucursalTotal(client, atm.sucursal_id);

      return {
        atm: this.toAtmRecord(updatedAtm),
        movimiento: this.toMovimientoRecord(movement),
        sucursalTotal,
      };
    });
  }

  private async findByCodeInternal(client: PoolClient, codigo: string): Promise<AtmDetailRow | null> {
    const { rows } = await client.query<AtmDetailRow>(`${ATM_SELECT} where lower(a.codigo) = lower($1) limit 1`, [codigo]);
    return rows[0] ?? null;
  }

  private async findByCashboxInternal(client: PoolClient, cajaId: string): Promise<AtmDetailRow | null> {
    const { rows } = await client.query<AtmDetailRow>(`${ATM_SELECT} where a.caja_id = $1 limit 1`, [cajaId]);
    return rows[0] ?? null;
  }

  private async getCashboxContext(client: PoolClient, cajaId: string): Promise<CashboxContextRow | null> {
    const { rows } = await client.query<CashboxContextRow>(
      `select
         c.id::text as id,
         c.sucursal_id::text as sucursal_id,
         c.codigo,
         c.nombre,
         c.moneda
       from caja c
       where c.id = $1
       limit 1
       for update`,
      [cajaId]
    );

    return rows[0] ?? null;
  }

  private async getAtmForUpdate(client: PoolClient, atmId: string): Promise<AtmDetailRow> {
    // Lock only the atm row first, then fetch the full detail
    await client.query(`select id from atm where id = $1 for update`, [atmId]);
    const { rows } = await client.query<AtmDetailRow>(`${ATM_SELECT} where a.id = $1 limit 1`, [atmId]);

    const atm = rows[0];
    if (!atm) {
      throw AtmError.notFound(atmId);
    }

    if (!atm.caja_id) {
      throw AtmError.invalidContext(
        "El ATM no tiene una caja asociada válida para registrar movimientos"
      );
    }

    return atm;
  }

  private validateOperationContext(atm: AtmDetailRow, dto: AtmOperationDto): void {
    if (dto.sucursalId && dto.sucursalId !== atm.sucursal_id) {
      throw AtmError.invalidContext("El ATM no pertenece a la sucursal enviada en la operación");
    }

    if (dto.cajaId && dto.cajaId !== atm.caja_id) {
      throw AtmError.invalidContext(
        "La caja enviada no coincide con la caja asociada al ATM"
      );
    }
  }

  private async getSessionForUpdate(client: PoolClient, sessionId: string): Promise<SessionRow | null> {
    const { rows } = await client.query<SessionRow>(
      `select
         id::text as id,
         caja_id::text as caja_id,
         estado,
         saldo_inicial::text as saldo_inicial
       from sesioncaja
       where id = $1
       limit 1
       for update`,
      [sessionId]
    );

    return rows[0] ?? null;
  }

  private async getSessionCurrentBalance(client: PoolClient, sessionId: string): Promise<number> {
    const { rows } = await client.query<SessionTotalsRow>(
      `select
         coalesce(sum(
           case
             when estado = 'ACTIVO' and tipo in ('INGRESO', 'REABASTECIMIENTO')
               then monto
             else 0
           end
         ), 0)::text as ingresos,
         coalesce(sum(
           case
             when estado = 'ACTIVO' and tipo in ('EGRESO', 'TRANSFERENCIA')
               then monto
             else 0
           end
         ), 0)::text as egresos
       from movimientoefectivo
       where sesion_caja_id = $1`,
      [sessionId]
    );

    const session = await this.getSessionForUpdate(client, sessionId);
    if (!session) {
      throw AtmError.sessionNotFound(sessionId);
    }

    return Number(session.saldo_inicial) + Number(rows[0]?.ingresos ?? 0) - Number(rows[0]?.egresos ?? 0);
  }

  private async insertMovement(
    client: PoolClient,
    data: {
      tipo: "INGRESO" | "EGRESO";
      monto: number;
      moneda: string;
      referencia: string;
      observacion: string;
      cajaId: string;
      sesionCajaId: string;
      usuarioId: string;
      atmId: string;
    }
  ): Promise<string> {
    const { rows } = await client.query<{ id: string }>(
      `insert into movimientoefectivo
        (fecha, tipo, medio, monto, moneda, referencia, observacion, estado,
         caja_id, sesion_caja_id, usuario_id, caja_origen_id, caja_destino_id, atm_id)
       values (now(), $1, 'ATM', $2, $3, $4, $5, 'ACTIVO', $6, $7, $8, null, null, $9)
       returning id::text as id`,
      [
        data.tipo,
        data.monto,
        data.moneda,
        data.referencia,
        data.observacion,
        data.cajaId,
        data.sesionCajaId,
        data.usuarioId,
        data.atmId,
      ]
    );

    return rows[0].id;
  }

  private async loadMovementById(client: PoolClient, movementId: string): Promise<MovementDetailRow> {
    const { rows } = await client.query<MovementDetailRow>(`${ATM_MOVEMENT_SELECT} where me.id = $1 limit 1`, [movementId]);

    const movement = rows[0];
    if (!movement) {
      throw new Error(`Movimiento ATM ${movementId} no pudo ser cargado`);
    }

    return movement;
  }

  private async syncSucursalTotal(client: PoolClient, sucursalId: string): Promise<number> {
    const { rows } = await client.query<{ total: string }>(
      `with atm_totals as (
         select coalesce(sum(a.saldo_actual), 0)::numeric as total
         from atm a
         where a.sucursal_id = $1
       ),
       caja_totals as (
         select coalesce(sum(
           case
             when latest_session.id is null then 0::numeric
             when latest_session.estado = 'ABIERTA' then
               latest_session.saldo_inicial
               + coalesce(session_totals.ingresos, 0)::numeric
               - coalesce(session_totals.egresos, 0)::numeric
             else coalesce(latest_session.saldo_final_real, 0)::numeric
           end
         ), 0)::numeric as total
         from caja c
         left join lateral (
           select
             sc.id,
             sc.estado,
             sc.saldo_inicial,
             sc.saldo_final_real,
             sc.fecha_apertura
           from sesioncaja sc
           where sc.caja_id = c.id
           order by
             case when sc.estado = 'ABIERTA' then 0 else 1 end,
             sc.fecha_apertura desc,
             sc.id desc
           limit 1
         ) latest_session on true
         left join lateral (
           select
             coalesce(sum(
               case
                 when me.estado = 'ACTIVO' and me.tipo in ('INGRESO', 'REABASTECIMIENTO')
                   then me.monto
                 else 0
               end
             ), 0)::numeric as ingresos,
             coalesce(sum(
               case
                 when me.estado = 'ACTIVO' and me.tipo in ('EGRESO', 'TRANSFERENCIA')
                   then me.monto
                 else 0
               end
             ), 0)::numeric as egresos
           from movimientoefectivo me
           where me.sesion_caja_id = latest_session.id
         ) session_totals on true
         where c.sucursal_id = $1
       )
       select round(
         coalesce((select total from caja_totals), 0)::numeric
         + coalesce((select total from atm_totals), 0)::numeric,
         2
       )::text as total`,
      [sucursalId]
    );

    const total = Number(rows[0]?.total ?? 0);

    await client.query(`update sucursal set total = $1 where id = $2`, [total, sucursalId]);

    return total;
  }

  private toAtmRecord(row: AtmDetailRow): AtmRecord {
    const balanceActual = Number(row.saldo_actual ?? 0);

    return {
      id: row.id,
      sucursalId: row.sucursal_id,
      sucursalCodigo: row.sucursal_codigo,
      sucursalNombre: row.sucursal_nombre,
      cajaId: row.caja_id,
      cajaCodigo: row.caja_codigo,
      cajaNombre: row.caja_nombre,
      codigo: row.codigo,
      nombre: row.nombre,
      estado: row.estado,
      moneda: row.moneda,
      limiteOperativo: Number(row.limite_operativo ?? 0),
      balanceActual,
      totalOperativo: balanceActual,
    };
  }

  private toMovimientoRecord(row: MovementDetailRow): AtmMovimientoRecord {
    return {
      id: row.id,
      fecha: row.fecha,
      tipo: row.tipo,
      tipoMovimiento: row.tipo === "EGRESO" ? "REABASTECIMIENTO" : "RETIRO",
      medio: row.medio,
      monto: Number(row.monto ?? 0),
      moneda: row.moneda,
      referencia: row.referencia,
      observacion: row.observacion,
      estado: row.estado,
      usuarioId: row.usuario_id,
      usuarioNombre: row.usuario_nombre,
      sesionCajaId: row.sesion_caja_id,
      cajaId: row.caja_id,
      cajaCodigo: row.caja_codigo,
      atmId: row.atm_id,
      atmCodigo: row.atm_codigo,
      atmNombre: row.atm_nombre,
      sucursalId: row.sucursal_id,
      sucursalCodigo: row.sucursal_codigo,
      sucursalNombre: row.sucursal_nombre,
    };
  }
}
