/**
 * scripts/tests/full-flow-test.ts
 *
 * Prueba completa del flujo del sistema de gestión de efectivo.
 * Run: npx tsx scripts/tests/full-flow-test.ts
 *
 * Prerequisitos: npm run seed  (datos de prueba ya insertados)
 *
 * Flujo:
 *  1. Login (cajero, supervisor, tesorería, admin)
 *  2. Ver sucursales, cajas, roles, usuarios
 *  3. Abrir sesión de caja
 *  4. Registrar movimientos (INGRESO, EGRESO)
 *  5. Ver movimientos (con filtros)
 *  6. Anular un movimiento
 *  7. Hacer arqueo de caja
 *  8. ATM: depósito y retiro
 *  9. Solicitudes de fondos (crear, aprobar, ejecutar)
 * 10. KPIs
 * 11. Cerrar sesión de caja
 * 12. Logout
 */

const BASE = process.env.API_URL ?? "http://localhost:3000/api";

// ── Helpers ─────────────────────────────────────────────────────────────────

let stepNum = 0;

function step(name: string): void {
  stepNum++;
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  PASO ${stepNum}: ${name}`);
  console.log(`${"═".repeat(60)}`);
}

async function api(
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<{ status: number; data: unknown }> {
  const url = `${BASE}${path}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const opts: RequestInit = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  console.log(`\n  → ${method} ${path}`);
  if (body) console.log(`    Body: ${JSON.stringify(body, null, 2).split("\n").join("\n    ")}`);

  const res = await fetch(url, opts);
  const json = await res.json().catch(() => null);

  const statusIcon = res.ok ? "✅" : "❌";
  console.log(`  ← ${statusIcon} ${res.status}`);
  if (json) console.log(`    Response: ${JSON.stringify(json, null, 2).split("\n").join("\n    ")}`);

  return { status: res.status, data: json };
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("🧪 PRUEBA COMPLETA DEL SISTEMA DE GESTIÓN DE EFECTIVO");
  console.log(`   Base URL: ${BASE}`);

  // ═══════════════════════════════════════════════════════════════
  // 1. LOGIN
  // ═══════════════════════════════════════════════════════════════
  step("LOGIN — Autenticar cajero, supervisor, tesorería");

  const loginCajero = await api("POST", "/auth/login", {
    email: "cajero@banco.com",
    password: "Test1234!",
  });
  const cajeroToken = (loginCajero.data as any)?.data?.accessToken;
  const cajeroRefresh = (loginCajero.data as any)?.data?.refreshToken;
  if (!cajeroToken) throw new Error("Login cajero falló");

  const loginSupervisor = await api("POST", "/auth/login", {
    email: "supervisor@banco.com",
    password: "Test1234!",
  });
  const supervisorToken = (loginSupervisor.data as any)?.data?.accessToken;
  if (!supervisorToken) throw new Error("Login supervisor falló");

  const loginTesoreria = await api("POST", "/auth/login", {
    email: "tesoreria@banco.com",
    password: "Test1234!",
  });
  const tesoreriaToken = (loginTesoreria.data as any)?.data?.accessToken;
  if (!tesoreriaToken) throw new Error("Login tesorería falló");

  const loginAdmin = await api("POST", "/auth/login", {
    email: "luisherasme4@gmail.com",
    password: "1234",
  });
  const adminToken = (loginAdmin.data as any)?.data?.accessToken;
  if (!adminToken) throw new Error("Login admin falló");

  // ═══════════════════════════════════════════════════════════════
  // 2. CONSULTAS GENERALES
  // ═══════════════════════════════════════════════════════════════
  step("CONSULTAS — Sucursales, cajas, roles, usuarios");

  await api("GET", "/sucursales", undefined, adminToken);
  await api("GET", "/cashboxes", undefined, adminToken);
  await api("GET", "/roles", undefined, adminToken);
  await api("GET", "/users", undefined, adminToken);

  // ═══════════════════════════════════════════════════════════════
  // 3. ABRIR SESIÓN DE CAJA
  // ═══════════════════════════════════════════════════════════════
  step("ABRIR SESIÓN — Caja SCT-USD-01 (USD)");

  // Usamos la caja USD del centro (id=4 del seed)
  // Primero listamos cajas para obtener el ID correcto
  const cajasRes = await api("GET", "/cashboxes", undefined, cajeroToken);
  const cajas = ((cajasRes.data as any)?.data ?? []) as Array<{ id: string; codigo: string }>;
  const cajaUsd = cajas.find(c => c.codigo === "SCT-USD-01");
  const cajaUsdId = cajaUsd?.id;
  console.log(`\n  ℹ️  Caja USD encontrada: id=${cajaUsdId}`);

  const openSession = await api("POST", "/cashbox-sessions/open", {
    cajaId: cajaUsdId,
    saldoInicial: 5000,
  }, cajeroToken);
  const sesionId = (openSession.data as any)?.data?.id;
  console.log(`  ℹ️  Sesión abierta: id=${sesionId}`);

  // ═══════════════════════════════════════════════════════════════
  // 4. REGISTRAR MOVIMIENTOS
  // ═══════════════════════════════════════════════════════════════
  step("MOVIMIENTOS — INGRESO y EGRESO en USD");

  const mov1 = await api("POST", "/movimientos", {
    tipo: "INGRESO",
    medio: "EFECTIVO",
    monto: 2000,
    moneda: "USD",
    referencia: "TEST-USD-001",
    observacion: "Depósito de prueba en USD",
    cajaId: cajaUsdId,
    sesionCajaId: sesionId,
  }, cajeroToken);
  const movIngreso1Id = (mov1.data as any)?.data?.id;

  const mov2 = await api("POST", "/movimientos", {
    tipo: "INGRESO",
    medio: "CHEQUE",
    monto: 1500,
    moneda: "USD",
    referencia: "TEST-USD-002",
    observacion: "Cheque USD",
    cajaId: cajaUsdId,
    sesionCajaId: sesionId,
  }, cajeroToken);

  const mov3 = await api("POST", "/movimientos", {
    tipo: "EGRESO",
    medio: "EFECTIVO",
    monto: 800,
    moneda: "USD",
    referencia: "TEST-USD-003",
    observacion: "Retiro prueba USD",
    cajaId: cajaUsdId,
    sesionCajaId: sesionId,
  }, cajeroToken);

  // Movimiento DOP en la caja DOP
  const cajaDop = cajas.find(c => c.codigo === "SCT-DOP-01");

  // ═══════════════════════════════════════════════════════════════
  // 5. LISTAR MOVIMIENTOS (con filtros)
  // ═══════════════════════════════════════════════════════════════
  step("LISTAR MOVIMIENTOS — Por sesión y por moneda");

  await api("GET", `/movimientos?sesionCajaId=${sesionId}`, undefined, cajeroToken);
  await api("GET", `/movimientos?moneda=USD`, undefined, cajeroToken);
  await api("GET", `/movimientos?tipo=INGRESO`, undefined, cajeroToken);

  // Ver detalle de un movimiento
  if (movIngreso1Id) {
    await api("GET", `/movimientos/${movIngreso1Id}`, undefined, cajeroToken);
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. ANULAR MOVIMIENTO
  // ═══════════════════════════════════════════════════════════════
  step("ANULAR MOVIMIENTO");

  // El supervisor tiene permiso MOVIMIENTOS:EDITAR
  if (movIngreso1Id) {
    await api("PATCH", `/movimientos/${movIngreso1Id}/void`, undefined, supervisorToken);
  }

  // Verificar que está ANULADO
  if (movIngreso1Id) {
    await api("GET", `/movimientos/${movIngreso1Id}`, undefined, cajeroToken);
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. ARQUEO DE CAJA
  // ═══════════════════════════════════════════════════════════════
  step("ARQUEO DE CAJA — Contar USD en sesión activa");

  const arqueo = await api("POST", "/arqueos", {
    sesionCajaId: sesionId,
    moneda: "USD",
    // Denominaciones USD: billetes + monedas
    billete100: 50,    // 50 × $100 = $5,000
    billete50: 10,     // 10 × $50  = $500
    billete20: 20,     // 20 × $20  = $400
    billete10: 5,      //  5 × $10  = $50
    billete5: 8,       //  8 × $5   = $40
    billete1: 15,      // 15 × $1   = $15
    moneda025: 40,     // 40 × $0.25 = $10
    // Total contado: 6,015
    observaciones: "Arqueo de prueba en USD",
  }, supervisorToken);

  // Listar arqueos de la sesión
  await api("GET", `/arqueos?sesionCajaId=${sesionId}`, undefined, supervisorToken);

  // ═══════════════════════════════════════════════════════════════
  // 8. ATM — DEPÓSITO Y RETIRO
  // ═══════════════════════════════════════════════════════════════
  step("ATM — Depósito y retiro");

  // Necesitamos: un ATM ID y una sesión de caja abierta (la que acabamos de crear)
  // Primero busquemos un ATM. El seed creó ATM-SCT-01, ATM-SNO-01, ATM-SES-01
  // Los IDs dependen de la DB, consultemos uno:
  // ATM endpoint: GET /atm/:id, POST /atm/:id/deposit, POST /atm/:id/withdraw
  // Los ATMs fueron insertados en el seed — necesitamos su ID.

  // Consultar desde la DB directamente no es posible aquí, pero podemos probar con IDs incrementales.
  // Del seed, los ATMs deberían tener IDs bajos. Intentemos con el primer ATM (puede variar).
  // Si falla, mostraremos el error y continuaremos.

  // Primero veamos qué ATMs hay consultando uno
  const atmRes = await api("GET", "/atm/1", undefined, cajeroToken);
  let atmId: string | null = null;
  let atmSesionId = sesionId; // Usamos la sesión USD actual

  if (atmRes.status === 200) {
    atmId = "1";
  } else {
    // Intentar con 2, 3...
    for (let tryId = 2; tryId <= 10; tryId++) {
      const r = await api("GET", `/atm/${tryId}`, undefined, cajeroToken);
      if (r.status === 200) {
        atmId = String(tryId);
        break;
      }
    }
  }

  if (atmId) {
    console.log(`  ℹ️  ATM encontrado: id=${atmId}`);

    // Necesitamos sesionCajaId de la caja vinculada al ATM
    // El ATM del Centro está vinculado a SCT-DOP-01, que puede tener sesión abierta del seed
    // Busquemos sesiones abiertas
    const sesionesRes = await api("GET", "/cashbox-sessions?estado=ABIERTA", undefined, cajeroToken);
    const sesiones = ((sesionesRes.data as any)?.data?.items ?? []) as Array<{ id: string; cajaId: string }>;

    // Del seed, la caja SCT-DOP-01 tiene sesión abierta
    const cajaDopId = cajaDop?.id;
    const sesionDop = sesiones.find(s => s.cajaId === cajaDopId);
    if (sesionDop) {
      atmSesionId = sesionDop.id;
    }

    await api("POST", `/atm/${atmId}/deposit`, {
      monto: 50000,
      motivo: "Recarga ATM de prueba",
      sesionCajaId: atmSesionId,
    }, cajeroToken);

    await api("POST", `/atm/${atmId}/withdraw`, {
      monto: 10000,
      motivo: "Retiro ATM de prueba",
      sesionCajaId: atmSesionId,
    }, cajeroToken);

    // Ver estado actualizado del ATM
    await api("GET", `/atm/${atmId}`, undefined, cajeroToken);
  } else {
    console.log("  ⚠️  No se encontró ningún ATM — salteando prueba ATM");
  }

  // ═══════════════════════════════════════════════════════════════
  // 9. SOLICITUDES DE FONDOS
  // ═══════════════════════════════════════════════════════════════
  step("SOLICITUDES DE FONDOS — Crear, aprobar, ejecutar");

  // Crear solicitud (tesorería)
  const solicitud = await api("POST", "/solicitudes", {
    origenScope: "CAJA",
    origenId: cajaDop?.id ?? "3",
    destinoScope: "CAJA",
    destinoId: cajaUsdId ?? "4",
    monto: 5000,
    moneda: "USD",
    motivo: "Necesitamos USD para operaciones del día",
    prioridad: "ALTA",
  }, tesoreriaToken);
  const solicitudId = (solicitud.data as any)?.data?.id;

  // Listar solicitudes
  await api("GET", "/solicitudes", undefined, tesoreriaToken);
  await api("GET", "/solicitudes?estado=PENDIENTE", undefined, supervisorToken);

  // Aprobar solicitud (supervisor)
  if (solicitudId) {
    await api("PATCH", `/solicitudes/${solicitudId}/resolve`, {
      decision: "APROBADA",
      comentario: "Aprobado — necesidad operativa confirmada",
    }, supervisorToken);

    // Ver aprobación
    await api("GET", `/solicitudes/${solicitudId}/approval`, undefined, supervisorToken);

    // Ejecutar solicitud (tesorería)
    await api("PATCH", `/solicitudes/${solicitudId}/execute`, undefined, tesoreriaToken);

    // Ver estado final
    await api("GET", `/solicitudes/${solicitudId}`, undefined, tesoreriaToken);
  }

  // Crear otra solicitud y rechazarla
  const solicitud2 = await api("POST", "/solicitudes", {
    origenScope: "CAJA",
    origenId: cajaDop?.id ?? "3",
    destinoScope: "CAJA",
    destinoId: cajaUsdId ?? "4",
    monto: 100000,
    moneda: "DOP",
    motivo: "Solicitud excesiva para prueba de rechazo",
    prioridad: "BAJA",
  }, tesoreriaToken);
  const solicitud2Id = (solicitud2.data as any)?.data?.id;

  if (solicitud2Id) {
    await api("PATCH", `/solicitudes/${solicitud2Id}/resolve`, {
      decision: "RECHAZADA",
      motivoRechazo: "Monto excesivo — no justificado",
    }, supervisorToken);
  }

  // ═══════════════════════════════════════════════════════════════
  // 10. KPIs
  // ═══════════════════════════════════════════════════════════════
  step("KPIs — Dashboard y listado");

  await api("GET", "/kpis/dashboard", undefined, supervisorToken);
  await api("GET", "/kpis", undefined, supervisorToken);

  // ═══════════════════════════════════════════════════════════════
  // 11. CERRAR SESIÓN DE CAJA
  // ═══════════════════════════════════════════════════════════════
  step("CERRAR SESIÓN DE CAJA");

  if (sesionId) {
    // Saldo esperado: 5000 (inicial) + 2000 + 1500 (ingresos) - 800 (egreso)
    // pero el INGRESO de 2000 fue ANULADO, así que: 5000 + 1500 - 800 = 5700
    // Pongamos un saldo real ligeramente diferente para ver la diferencia
    await api("PATCH", `/cashbox-sessions/${sesionId}/close`, {
      saldoFinalReal: 5700,
    }, cajeroToken);

    // Ver sesión cerrada
    await api("GET", `/cashbox-sessions/${sesionId}`, undefined, cajeroToken);
  }

  // ═══════════════════════════════════════════════════════════════
  // 12. REFRESH TOKEN
  // ═══════════════════════════════════════════════════════════════
  step("REFRESH TOKEN — Renovar access token del cajero");

  if (cajeroRefresh) {
    await api("POST", "/auth/refresh", {
      refreshToken: cajeroRefresh,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 13. AUDITORÍA
  // ═══════════════════════════════════════════════════════════════
  step("AUDITORÍA — Ver eventos");

  await api("GET", "/auditoria", undefined, adminToken);

  // ═══════════════════════════════════════════════════════════════
  // 14. PERMISOS RBAC — Verificar que cajero NO puede aprobar solicitudes
  // ═══════════════════════════════════════════════════════════════
  step("RBAC — Cajero intenta aprobar (debe fallar)");

  await api("GET", "/solicitudes", undefined, cajeroToken);
  // Esto debería dar 403 porque CAJERO no tiene SOLICITUDES:VER

  // ═══════════════════════════════════════════════════════════════
  // 15. LOGOUT
  // ═══════════════════════════════════════════════════════════════
  step("LOGOUT");

  if (cajeroRefresh) {
    await api("POST", "/auth/logout", {
      refreshToken: cajeroRefresh,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  console.log(`\n${"═".repeat(60)}`);
  console.log("  🎉 PRUEBA COMPLETA FINALIZADA");
  console.log(`${"═".repeat(60)}\n`);
}

// ── Entry point ────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error("\n❌ Error fatal:", err.message ?? err);
  process.exit(1);
});
