/**
 * db/seeds/seed.ts
 *
 * Seed script for test/development environment.
 * Run with: npm run seed
 *
 * Users created (all with password: Test1234!):
 *   admin@banco.com      → ADMIN
 *   supervisor@banco.com → SUPERVISOR
 *   cajero@banco.com     → CAJERO  (Sucursal Centro)
 *   cajero2@banco.com    → CAJERO  (Sucursal Norte)
 *   tesoreria@banco.com  → TESORERIA
 *   auditor@banco.com    → AUDITOR
 *
 * Idempotent: safe to run multiple times (skips existing records).
 */

import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { env } from "../../src/config/env";

// ── Pool ──────────────────────────────────────────────────────────────────────

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.dbSsl ? { rejectUnauthorized: false } : false,
});

async function q(sql: string, params: unknown[] = []): Promise<{ rows: Record<string, unknown>[] }> {
  return pool.query(sql, params);
}

function log(msg: string): void {
  console.log(`  ✓ ${msg}`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Inserts a row only if no matching row exists. Returns the id. */
async function upsertByField(
  table: string,
  field: string,
  value: unknown,
  insertSql: string,
  insertParams: unknown[]
): Promise<number> {
  const { rows } = await q(`select id from ${table} where ${field} = $1 limit 1`, [value]);
  if (rows.length > 0) return (rows[0] as any).id;
  const { rows: ins } = await q(insertSql, insertParams);
  return (ins[0] as any).id;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  console.log("\n🌱 Iniciando seed de datos de prueba...\n");

  const passwordHash = await bcrypt.hash("Test1234!", 12);

  // ── 1. Monedas ────────────────────────────────────────────────────────────
  console.log("1. Monedas...");
  await q(`
    insert into moneda (codigo, nombre) values
      ('DOP', 'Peso Dominicano'),
      ('USD', 'Dólar Estadounidense'),
      ('EUR', 'Euro')
    on conflict (codigo) do nothing
  `);
  log("DOP, USD, EUR");

  // ── 2. Roles ──────────────────────────────────────────────────────────────
  console.log("2. Roles...");
  const roleNames = ["CAJERO", "SUPERVISOR", "TESORERIA", "AUDITOR", "ADMIN"];
  const roleIds: Record<string, number> = {};
  for (const nombre of roleNames) {
    roleIds[nombre] = await upsertByField(
      "rol", "nombre", nombre,
      `insert into rol (nombre) values ($1) returning id`, [nombre]
    );
  }
  log(roleNames.map(n => `${n}(id=${roleIds[n]})`).join(", "));

  // ── 3. Permisos ───────────────────────────────────────────────────────────
  console.log("3. Permisos...");
  const resources = [
    "USUARIOS", "ROLES", "PERMISOS", "SUCURSALES", "CAJAS",
    "SESION_CAJA", "MOVIMIENTOS", "TESORERIA", "SOLICITUDES",
    "AUDITORIA", "PARAMETROS", "KPI", "RECOMENDACIONES", "ARQUEOS",
  ];
  const actions = ["VER", "CREAR", "EDITAR", "ELIMINAR", "APROBAR", "CERRAR", "EXPORTAR", "ADMIN"];

  const permisoIds: Record<string, number> = {};
  for (const recurso of resources) {
    for (const accion of actions) {
      const key = `${recurso}:${accion}`;
      const { rows } = await q(
        `select id from permiso where recurso = $1 and accion = $2 limit 1`,
        [recurso, accion]
      );
      if (rows.length > 0) {
        permisoIds[key] = (rows[0] as any).id;
      } else {
        const { rows: ins } = await q(
          `insert into permiso (recurso, accion) values ($1, $2) returning id`,
          [recurso, accion]
        );
        permisoIds[key] = (ins[0] as any).id;
      }
    }
  }
  log(`${Object.keys(permisoIds).length} permisos`);

  // ── 4. Rol → Permisos ─────────────────────────────────────────────────────
  console.log("4. Asignando permisos a roles...");

  async function assignPerms(rolNombre: string, perms: string[]): Promise<void> {
    const rolId = roleIds[rolNombre];
    for (const key of perms) {
      const permisoId = permisoIds[key];
      if (!permisoId) continue;
      await q(
        `insert into rolpermiso (rol_id, permiso_id) values ($1, $2) on conflict do nothing`,
        [rolId, permisoId]
      );
    }
  }

  await assignPerms("CAJERO", [
    "SESION_CAJA:VER", "SESION_CAJA:CREAR", "SESION_CAJA:CERRAR",
    "MOVIMIENTOS:VER", "MOVIMIENTOS:CREAR",
    "ARQUEOS:VER", "ARQUEOS:CREAR",
    "CAJAS:VER", "SUCURSALES:VER",
  ]);
  log("CAJERO: 9 permisos");

  await assignPerms("SUPERVISOR", [
    "SESION_CAJA:VER", "SESION_CAJA:CREAR", "SESION_CAJA:CERRAR",
    "MOVIMIENTOS:VER", "MOVIMIENTOS:CREAR", "MOVIMIENTOS:EXPORTAR",
    "ARQUEOS:VER", "ARQUEOS:CREAR",
    "SOLICITUDES:VER", "SOLICITUDES:APROBAR",
    "CAJAS:VER", "CAJAS:EDITAR",
    "SUCURSALES:VER", "USUARIOS:VER", "KPI:VER",
  ]);
  log("SUPERVISOR: 15 permisos");

  await assignPerms("TESORERIA", [
    "TESORERIA:VER", "TESORERIA:CREAR", "TESORERIA:EDITAR", "TESORERIA:EXPORTAR",
    "MOVIMIENTOS:VER", "MOVIMIENTOS:CREAR", "MOVIMIENTOS:EDITAR", "MOVIMIENTOS:EXPORTAR",
    "SOLICITUDES:VER", "SOLICITUDES:CREAR", "SOLICITUDES:APROBAR", "SOLICITUDES:EXPORTAR",
    "CAJAS:VER", "CAJAS:EDITAR",
    "SUCURSALES:VER", "KPI:VER", "KPI:EXPORTAR",
    "SESION_CAJA:VER", "ARQUEOS:VER", "ARQUEOS:EXPORTAR",
  ]);
  log("TESORERIA: 20 permisos");

  await assignPerms("AUDITOR", [
    "AUDITORIA:VER", "AUDITORIA:EXPORTAR",
    "MOVIMIENTOS:VER", "MOVIMIENTOS:EXPORTAR",
    "SESION_CAJA:VER",
    "ARQUEOS:VER", "ARQUEOS:EXPORTAR",
    "SOLICITUDES:VER", "SOLICITUDES:EXPORTAR",
    "CAJAS:VER", "SUCURSALES:VER",
    "USUARIOS:VER", "KPI:VER", "KPI:EXPORTAR", "PARAMETROS:VER",
  ]);
  log("AUDITOR: 15 permisos");

  // ADMIN gets every permission
  await assignPerms("ADMIN", Object.keys(permisoIds));
  log(`ADMIN: ${Object.keys(permisoIds).length} permisos`);

  // ── 5. Sucursales ─────────────────────────────────────────────────────────
  console.log("5. Sucursales...");
  const sucursalDefs = [
    { codigo: "SCT", nombre: "Sucursal Centro" },
    { codigo: "SNO", nombre: "Sucursal Norte"  },
    { codigo: "SES", nombre: "Sucursal Este"   },
  ];
  const sucIds: Record<string, number> = {};
  for (const s of sucursalDefs) {
    sucIds[s.codigo] = await upsertByField(
      "sucursal", "codigo", s.codigo,
      `insert into sucursal (codigo, nombre, estado) values ($1, $2, 'ACTIVA') returning id`,
      [s.codigo, s.nombre]
    );
  }
  log(sucursalDefs.map(s => `${s.codigo}(id=${sucIds[s.codigo]})`).join(", "));

  // ── 6. Cajas ──────────────────────────────────────────────────────────────
  console.log("6. Cajas...");
  const cajaDefs = [
    { codigo: "SCT-DOP-01", nombre: "Caja Principal DOP Centro", sucursal: "SCT", moneda: "DOP", limite: 500000 },
    { codigo: "SCT-USD-01", nombre: "Caja USD Centro",            sucursal: "SCT", moneda: "USD", limite: 10000  },
    { codigo: "SNO-DOP-01", nombre: "Caja Principal DOP Norte",   sucursal: "SNO", moneda: "DOP", limite: 300000 },
    { codigo: "SES-DOP-01", nombre: "Caja Principal DOP Este",    sucursal: "SES", moneda: "DOP", limite: 300000 },
  ];
  const cajaIds: Record<string, number> = {};
  for (const c of cajaDefs) {
    cajaIds[c.codigo] = await upsertByField(
      "caja", "codigo", c.codigo,
      `insert into caja (sucursal_id, codigo, nombre, estado, moneda, limite_operativo)
       values ($1, $2, $3, 'ACTIVA', $4, $5) returning id`,
      [sucIds[c.sucursal], c.codigo, c.nombre, c.moneda, c.limite]
    );
  }
  log(cajaDefs.map(c => `${c.codigo}(id=${cajaIds[c.codigo]})`).join(", "));

  // ── 7. ATMs (unique constraint: one ATM per sucursal) ─────────────────────
  console.log("7. ATMs...");
  const atmDefs = [
    { codigo: "ATM-SCT-01", nombre: "ATM Centro",  sucursal: "SCT", caja: "SCT-DOP-01", moneda: "DOP", limite: 200000 },
    { codigo: "ATM-SNO-01", nombre: "ATM Norte",   sucursal: "SNO", caja: "SNO-DOP-01", moneda: "DOP", limite: 150000 },
    { codigo: "ATM-SES-01", nombre: "ATM Este",    sucursal: "SES", caja: "SES-DOP-01", moneda: "DOP", limite: 100000 },
  ];
  for (const a of atmDefs) {
    const { rows: existing } = await q(`select id from atm where codigo = $1 limit 1`, [a.codigo]);
    if (existing.length === 0) {
      await q(
        `insert into atm (sucursal_id, caja_id, codigo, nombre, estado, moneda, limite_operativo)
         values ($1, $2, $3, $4, 'ACTIVO', $5, $6)`,
        [sucIds[a.sucursal], cajaIds[a.caja], a.codigo, a.nombre, a.moneda, a.limite]
      );
    }
  }
  log(atmDefs.map(a => a.codigo).join(", "));

  // ── 8. Usuarios ───────────────────────────────────────────────────────────
  console.log("8. Usuarios...");
  const usuarioDefs = [
    { email: "admin@banco.com",      nombre: "Admin Sistema",       rol: "ADMIN",      sucursal: null   },
    { email: "supervisor@banco.com", nombre: "Carlos Supervisor",   rol: "SUPERVISOR", sucursal: "SCT"  },
    { email: "cajero@banco.com",     nombre: "Ana Cajero",          rol: "CAJERO",     sucursal: "SCT"  },
    { email: "cajero2@banco.com",    nombre: "Pedro Cajero Norte",  rol: "CAJERO",     sucursal: "SNO"  },
    { email: "tesoreria@banco.com",  nombre: "Luis Tesorería",      rol: "TESORERIA",  sucursal: null   },
    { email: "auditor@banco.com",    nombre: "María Auditora",      rol: "AUDITOR",    sucursal: null   },
  ];
  const userIds: Record<string, number> = {};
  for (const u of usuarioDefs) {
    const sucursalId = u.sucursal ? sucIds[u.sucursal] : null;
    userIds[u.email] = await upsertByField(
      "usuario", "username_email", u.email,
      `insert into usuario (username_email, nombre, estado, password_hash, sucursal_default_id)
       values ($1, $2, 'ACTIVO', $3, $4) returning id`,
      [u.email, u.nombre, passwordHash, sucursalId]
    );
    // Assign role
    await q(
      `insert into usuariorol (usuario_id, rol_id) values ($1, $2) on conflict do nothing`,
      [userIds[u.email], roleIds[u.rol]]
    );
  }
  log(`${usuarioDefs.length} usuarios`);
  for (const u of usuarioDefs) {
    log(`  ${u.email} → ${u.rol} (id=${userIds[u.email]})`);
  }

  // ── 9. Sesiones de Caja ───────────────────────────────────────────────────
  console.log("9. Sesiones de caja...");
  const cajeroId     = userIds["cajero@banco.com"];
  const cajero2Id    = userIds["cajero2@banco.com"];
  const supervisorId = userIds["supervisor@banco.com"];

  const { rows: sesiones } = await q(`
    insert into sesioncaja
      (caja_id, usuario_apertura_id, fecha_apertura, saldo_inicial,
       saldo_final_esperado, saldo_final_real, diferencia, estado)
    values
      ($1, $3, now() - interval '2 hours', 50000,  0,     0,     0, 'ABIERTA'),
      ($2, $4, now() - interval '1 hour',  20000,  0,     0,     0, 'ABIERTA'),
      ($1, $3, now() - interval '1 day',   50000,  62000, 62000, 0, 'CERRADA')
    returning id, caja_id
  `, [cajaIds["SCT-DOP-01"], cajaIds["SNO-DOP-01"], cajeroId, cajero2Id]);

  const sesionCentroId  = (sesiones[0] as any)?.id;
  const sesionNorteId   = (sesiones[1] as any)?.id;
  const sesionCerradaId = (sesiones[2] as any)?.id;
  log(`Centro(id=${sesionCentroId}), Norte(id=${sesionNorteId}), Cerrada(id=${sesionCerradaId})`);

  // ── 10. Movimientos de Efectivo ───────────────────────────────────────────
  console.log("10. Movimientos de efectivo...");
  await q(`
    insert into movimientoefectivo
      (fecha, tipo, medio, monto, moneda, referencia, observacion, estado,
       caja_id, sesion_caja_id, usuario_id, caja_origen_id, caja_destino_id)
    values
      (now()-interval '90 min','INGRESO','EFECTIVO',         15000,'DOP','TXN-001','Depósito apertura',          'ACTIVO',$1,$3,$5,null,null),
      (now()-interval '80 min','INGRESO','CHEQUE',            8500,'DOP','TXN-002','Cheque empresa XYZ',         'ACTIVO',$1,$3,$5,null,null),
      (now()-interval '70 min','EGRESO', 'EFECTIVO',          3200,'DOP','TXN-003','Pago proveedor',             'ACTIVO',$1,$3,$5,null,null),
      (now()-interval '60 min','INGRESO','EFECTIVO',           500,'USD','TXN-004','Depósito USD',               'ACTIVO',$2,$3,$5,null,null),
      (now()-interval '50 min','INGRESO','EFECTIVO',          25000,'DOP','TXN-005','Recarga caja Norte',        'ACTIVO',$4,$6,$7,null,null),
      (now()-interval '40 min','EGRESO', 'EFECTIVO',           1500,'DOP','TXN-006','Retiro cliente',            'ACTIVO',$4,$6,$7,null,null),
      (now()-interval '30 min','INGRESO','EFECTIVO',           5000,'DOP','TXN-007','Ingreso en ATM',            'ACTIVO',$1,$3,$5,null,null),
      (now()-interval '20 min','EGRESO', 'EFECTIVO',           2000,'DOP','TXN-008','Retiro ATM',               'ACTIVO',$1,$3,$5,null,null),
      (now()-interval '10 min','INGRESO','TRANSFERENCIA_BANCARIA',10000,'DOP','TXN-009','Transferencia entrante','ACTIVO',$1,$3,$5,null,null),
      (now()-interval  '5 min','EGRESO', 'EFECTIVO',            750,'DOP',null,null,                           'ANULADO',$1,$3,$5,null,null)
  `, [
    cajaIds["SCT-DOP-01"], cajaIds["SCT-USD-01"],
    sesionCentroId,
    cajaIds["SNO-DOP-01"], cajeroId,
    sesionNorteId, cajero2Id,
  ]);
  log("10 movimientos (DOP + USD, INGRESO/EGRESO, uno ANULADO)");

  // ── 11. Solicitudes de Fondos ─────────────────────────────────────────────
  console.log("11. Solicitudes de fondos...");
  await q(`
    insert into solicitudfondos
      (origen_scope, origen_id, destino_scope, destino_id,
       monto, moneda, motivo, prioridad, estado, solicitada_por, fecha_solicitud)
    values
      ('CAJA',$1,'CAJA',$3, 50000,'DOP','Reabastecimiento mensual caja centro','ALTA',   'PENDIENTE',$5, now()-interval '3 hours'),
      ('CAJA',$2,'CAJA',$4, 30000,'DOP','Refuerzo de fondos caja norte',       'MEDIA',  'APROBADA', $6, now()-interval '2 hours'),
      ('CAJA',$1,'CAJA',$3,  2000,'USD','Solicitud USD para operaciones',      'MEDIA',  'PENDIENTE',$5, now()-interval '1 hour'),
      ('CAJA',$1,'CAJA',$3, 10000,'DOP','Ajuste de liquidez',                  'BAJA',   'RECHAZADA',$5, now()-interval '30 min')
  `, [
    cajaIds["SCT-DOP-01"], cajaIds["SNO-DOP-01"],
    cajaIds["SCT-DOP-01"], cajaIds["SNO-DOP-01"],
    cajeroId, cajero2Id,
  ]);
  log("4 solicitudes (DOP + USD, PENDIENTE/APROBADA/RECHAZADA)");

  // ── 12. Arqueos de Caja ───────────────────────────────────────────────────
  console.log("12. Arqueos de caja...");
  await q(`
    insert into arqueocaja
      (sesion_caja_id, usuario_id, fecha, moneda,
       saldo_contado, saldo_esperado, diferencia,
       motivo_diferencia, observaciones)
    values
      ($1, $2, now()-interval '45 min', 'DOP',
       74500, 75300, -800,
       'Error en cambio', 'Arqueo de control a mitad de turno')
  `, [sesionCentroId, supervisorId]);
  log("1 arqueo DOP (diferencia: -800)");

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log("\n✅ Seed completado exitosamente.\n");
  console.log("  Credenciales (contraseña: Test1234!):");
  console.log("  ┌──────────────────────────────┬─────────────┬──────────────┐");
  console.log("  │ Email                         │ Rol         │ Sucursal     │");
  console.log("  ├──────────────────────────────┼─────────────┼──────────────┤");
  console.log("  │ admin@banco.com               │ ADMIN       │ —            │");
  console.log("  │ supervisor@banco.com          │ SUPERVISOR  │ SCT (Centro) │");
  console.log("  │ cajero@banco.com              │ CAJERO      │ SCT (Centro) │");
  console.log("  │ cajero2@banco.com             │ CAJERO      │ SNO (Norte)  │");
  console.log("  │ tesoreria@banco.com           │ TESORERIA   │ —            │");
  console.log("  │ auditor@banco.com             │ AUDITOR     │ —            │");
  console.log("  └──────────────────────────────┴─────────────┴──────────────┘");
}

// ── Entry point ───────────────────────────────────────────────────────────────

seed()
  .catch((err) => {
    console.error("\n❌ Error en el seed:", err?.message ?? err);
    process.exit(1);
  })
  .finally(() => pool.end());
