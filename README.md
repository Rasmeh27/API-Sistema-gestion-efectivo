Aquí tienes el README completo:

---

# Sistema de Gestión de Efectivo Bancario

API REST para la gestión integral de efectivo en sucursales bancarias. Controla cajas, movimientos, ATMs, arqueos, solicitudes de fondos, auditoría y KPIs con soporte multi-divisa (DOP, USD, EUR).

## Stack Tecnológico

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Base de datos:** PostgreSQL (Supabase)
- **Auth:** JWT (access + refresh token rotation) + bcrypt(12)
- **Arquitectura:** Modular (repository pattern)

## Instalación

```bash
git clone https://github.com/tu-org/Sistema-gestion-efectivo.git
cd Sistema-gestion-efectivo
npm install
```

## Configuración

Crear archivo `.env` en la raíz:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=tu_secreto_jwt
JWT_EXPIRES_IN=900
```

## Ejecutar

```bash
# Desarrollo
npx tsx src/index.ts

# Seed de datos de prueba
npx tsx db/seeds/seed.ts
```

## Ejecutar Tests

```bash
npm run test:flow
```

---

## Autenticación

Todos los endpoints protegidos requieren:

```
Authorization: Bearer <access_token>
```

El `accessToken` se obtiene del login y expira según `expiresIn` (segundos). Usa el `refreshToken` para renovarlo.

---

## Roles del Sistema

| ID | Rol | Descripción |
|----|-----|-------------|
| 1 | CAJERO | Operaciones básicas de caja |
| 2 | SUPERVISOR | Supervisión, arqueos, aprobaciones |
| 3 | TESORERIA | Gestión de fondos y movimientos |
| 4 | AUDITOR | Solo lectura y exportación |
| 5 | ADMIN | Acceso total |

> **Nota:** Los IDs pueden variar según el seed. Consultar `GET /api/roles` para confirmar.

---

## Usuarios de Prueba (Seed)

| Email | Password | Rol |
|-------|----------|-----|
| cajero@banco.com | Test1234! | CAJERO |
| supervisor@banco.com | Test1234! | SUPERVISOR |
| tesoreria@banco.com | Test1234! | TESORERIA |
| auditor@banco.com | Test1234! | AUDITOR |
| admin@banco.com | Test1234! | ADMIN |

---

## Formato de Errores

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Descripción del error"
  }
}
```

| Código HTTP | Significado |
|-------------|-------------|
| 200 | OK |
| 201 | Creado |
| 204 | Sin contenido (DELETE/Logout exitoso) |
| 400 | Error de validación |
| 401 | No autenticado |
| 403 | Sin permisos |
| 404 | No encontrado |

---

## Endpoints

### 1. Auth (Público)

#### POST /api/auth/login

```json
{
  "email": "cajero@banco.com",
  "password": "Test1234!"
}
```

**Respuesta 200:**
```json
{
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "f73e8ce0ac...",
    "expiresIn": 900
  }
}
```

#### POST /api/auth/refresh

```json
{
  "refreshToken": "f73e8ce0ac..."
}
```

**Respuesta 200:** Mismo formato que login.

#### POST /api/auth/logout

```json
{
  "refreshToken": "f73e8ce0ac..."
}
```

**Respuesta:** 204 No Content

#### POST /api/auth/logout-all

**Auth:** Bearer Token requerido. Sin body.

**Respuesta 200:**
```json
{
  "data": { "revokedSessions": 3 }
}
```

---

### 2. Usuarios

#### POST /api/users
**Permiso:** `USUARIOS:CREAR`

```json
{
  "email": "nuevo@banco.com",
  "name": "Juan Pérez",
  "password": "MiPassword123!",
  "roleIds": [4],
  "sucursalDefaultId": "1"
}
```

#### GET /api/users
**Permiso:** `USUARIOS:VER`

Query params: `?page=1&perPage=20&status=ACTIVO&roleIds=4`

#### GET /api/users/:id
**Permiso:** `USUARIOS:VER`

#### PATCH /api/users/:id
**Permiso:** `USUARIOS:EDITAR`

```json
{
  "name": "Nuevo Nombre",
  "roleIds": [4, 2],
  "status": "ACTIVO"
}
```

#### PATCH /api/users/:id/status
**Permiso:** `USUARIOS:EDITAR`

```json
{
  "status": "BLOQUEADO"
}
```

#### PATCH /api/users/:id/deactivate
**Permiso:** `USUARIOS:EDITAR` — Sin body.

---

### 3. Roles

#### POST /api/roles
**Permiso:** `ROLES:CREAR`

```json
{
  "nombre": "GESTOR",
  "permissionsIds": ["47", "48", "49"]
}
```

#### GET /api/roles
**Permiso:** `ROLES:VER`

#### GET /api/roles/:id
**Permiso:** `ROLES:VER`

#### PATCH /api/roles/:id
**Permiso:** `ROLES:EDITAR`

```json
{
  "nombre": "GESTOR_SENIOR",
  "permissionsIds": ["47", "48", "49", "50"]
}
```

#### DELETE /api/roles/:id
**Permiso:** `ROLES:ELIMINAR` — Respuesta 204.

---

### 4. Sucursales

#### POST /api/sucursales
**Permiso:** `SUCURSALES:CREAR`

```json
{
  "codigo": "SOE",
  "nombre": "Sucursal Oeste",
  "estado": "ACTIVA"
}
```

#### GET /api/sucursales
**Permiso:** `SUCURSALES:VER`

#### GET /api/sucursales/:id
**Permiso:** `SUCURSALES:VER`

#### PATCH /api/sucursales/:id
**Permiso:** `SUCURSALES:EDITAR`

```json
{
  "nombre": "Sucursal Oeste Renovada",
  "estado": "INACTIVA"
}
```

#### DELETE /api/sucursales/:id
**Permiso:** `SUCURSALES:ELIMINAR` — Respuesta 204.

---

### 5. Cajas (Cashboxes)

#### POST /api/cashboxes
**Permiso:** `CAJAS:CREAR`

```json
{
  "sucursalId": "5",
  "codigo": "SCT-EUR-01",
  "nombre": "Caja EUR Centro",
  "estado": "ACTIVA",
  "moneda": "EUR",
  "limiteOperativo": 50000
}
```

#### GET /api/cashboxes
**Permiso:** `CAJAS:VER`

#### GET /api/cashboxes/:id
**Permiso:** `CAJAS:VER`

#### PATCH /api/cashboxes/:id
**Permiso:** `CAJAS:EDITAR`

```json
{
  "limiteOperativo": 75000,
  "estado": "EN_MANTENIMIENTO"
}
```

#### DELETE /api/cashboxes/:id
**Permiso:** `CAJAS:ELIMINAR` — Respuesta 204.

---

### 6. Sesiones de Caja

#### POST /api/cashbox-sessions/open
**Permiso:** `SESION_CAJA:CREAR`

```json
{
  "cajaId": "4",
  "saldoInicial": 5000
}
```

**Respuesta 201:**
```json
{
  "data": {
    "id": "23",
    "cajaId": "4",
    "usuarioAperturaId": "5",
    "fechaApertura": "2026-03-23T01:46:32.000Z",
    "saldoInicial": 5000,
    "estado": "ABIERTA"
  }
}
```

#### PATCH /api/cashbox-sessions/:id/close
**Permiso:** `SESION_CAJA:CERRAR`

```json
{
  "saldoFinalReal": 5700
}
```

**Respuesta 200:**
```json
{
  "data": {
    "id": "23",
    "saldoFinalEsperado": 12700,
    "saldoFinalReal": 5700,
    "diferencia": 7000,
    "estado": "CERRADA"
  }
}
```

#### GET /api/cashbox-sessions
**Permiso:** `SESION_CAJA:VER`

Query params: `?cajaId=4&estado=ABIERTA&page=1&perPage=20`

#### GET /api/cashbox-sessions/:id
**Permiso:** `SESION_CAJA:VER`

---

### 7. Movimientos de Efectivo

#### POST /api/movimientos
**Permiso:** `MOVIMIENTOS:CREAR`

```json
{
  "tipo": "INGRESO",
  "medio": "EFECTIVO",
  "monto": 2000,
  "moneda": "USD",
  "referencia": "DEP-001",
  "observacion": "Depósito cliente",
  "cajaId": "4",
  "sesionCajaId": "23"
}
```

Tipos: `INGRESO` | `EGRESO` | `TRANSFERENCIA` | `REABASTECIMIENTO`

Para `TRANSFERENCIA` se requiere `cajaOrigenId` y `cajaDestinoId` (deben ser diferentes).
Para `REABASTECIMIENTO` se requiere `cajaDestinoId`.

Monedas: `DOP` (default) | `USD` | `EUR`

#### GET /api/movimientos
**Permiso:** `MOVIMIENTOS:VER`

Query params: `?sesionCajaId=23&cajaId=4&tipo=INGRESO&moneda=USD`

#### GET /api/movimientos/:id
**Permiso:** `MOVIMIENTOS:VER`

#### PATCH /api/movimientos/:id/void
**Permiso:** `MOVIMIENTOS:EDITAR` — Sin body. Anula el movimiento.

---

### 8. Arqueos de Caja

#### POST /api/arqueos
**Permiso:** `ARQUEOS:CREAR`

**Ejemplo USD:**
```json
{
  "sesionCajaId": "23",
  "moneda": "USD",
  "billete100": 50,
  "billete50": 10,
  "billete20": 20,
  "billete10": 5,
  "billete5": 8,
  "billete1": 15,
  "moneda025": 40,
  "observaciones": "Arqueo cierre de turno"
}
```

**Ejemplo DOP:**
```json
{
  "sesionCajaId": "15",
  "moneda": "DOP",
  "billete2000": 5,
  "billete1000": 10,
  "billete500": 8,
  "billete200": 3,
  "billete100": 12,
  "billete50": 20,
  "moneda25": 15,
  "moneda10": 30,
  "moneda5": 10,
  "moneda1": 25,
  "observaciones": "Arqueo turno mañana"
}
```

**Ejemplo EUR:**
```json
{
  "sesionCajaId": "18",
  "moneda": "EUR",
  "billete500": 1,
  "billete200": 2,
  "billete100": 5,
  "billete50": 10,
  "billete20": 15,
  "billete10": 20,
  "billete5": 8,
  "moneda2": 25,
  "moneda1": 30,
  "moneda050": 40,
  "moneda020": 50
}
```

> El `saldoContado` se calcula automáticamente a partir de las denominaciones. La `diferencia` = `saldoContado - saldoEsperado`.

#### GET /api/arqueos
**Permiso:** `ARQUEOS:VER`

Query params: `?sesionCajaId=23`

#### GET /api/arqueos/:id
**Permiso:** `ARQUEOS:VER`

---

### 9. ATM

#### GET /api/atm/:id
**Permiso:** `MOVIMIENTOS:VER`

**Respuesta:**
```json
{
  "data": {
    "id": "1",
    "sucursalId": "5",
    "cajaId": "3",
    "codigo": "ATM-SCT-01",
    "nombre": "ATM Centro",
    "estado": "ACTIVO",
    "moneda": "DOP",
    "limiteOperativo": "560000.00"
  }
}
```

#### POST /api/atm/:id/deposit
**Permiso:** `MOVIMIENTOS:CREAR`

```json
{
  "monto": 50000,
  "motivo": "Recarga ATM",
  "sesionCajaId": "13"
}
```

> Genera un movimiento tipo INGRESO con medio "ATM" en la caja vinculada.

#### POST /api/atm/:id/withdraw
**Permiso:** `MOVIMIENTOS:CREAR`

```json
{
  "monto": 10000,
  "motivo": "Retiro ATM",
  "sesionCajaId": "13"
}
```

> Genera un movimiento tipo EGRESO con medio "ATM" en la caja vinculada.

---

### 10. Solicitudes de Fondos

#### POST /api/solicitudes
**Permiso:** `SOLICITUDES:CREAR`

```json
{
  "origenScope": "CAJA",
  "origenId": "3",
  "destinoScope": "CAJA",
  "destinoId": "4",
  "monto": 5000,
  "moneda": "USD",
  "motivo": "Necesitamos USD para operaciones",
  "prioridad": "ALTA"
}
```

Prioridades: `BAJA` | `MEDIA` (default) | `ALTA` | `URGENTE`
Estados: `PENDIENTE` -> `APROBADA` -> `EJECUTADA` | `RECHAZADA`

#### GET /api/solicitudes
**Permiso:** `SOLICITUDES:VER`

Query params: `?estado=PENDIENTE&prioridad=ALTA&origenScope=CAJA&origenId=3`

#### GET /api/solicitudes/:id
**Permiso:** `SOLICITUDES:VER`

#### PATCH /api/solicitudes/:id/resolve
**Permiso:** `SOLICITUDES:APROBAR`

**Aprobar:**
```json
{
  "decision": "APROBADA",
  "comentario": "Aprobado — necesidad operativa confirmada"
}
```

**Rechazar:**
```json
{
  "decision": "RECHAZADA",
  "motivoRechazo": "Monto excesivo — no justificado"
}
```

#### PATCH /api/solicitudes/:id/execute
**Permiso:** `SOLICITUDES:APROBAR` — Sin body. Solo funciona si estado = `APROBADA`.

> Al ejecutar se generan 2 movimientos automáticos (EGRESO en origen + INGRESO en destino).

#### GET /api/solicitudes/:id/approval
**Permiso:** `SOLICITUDES:VER`

---

### 11. KPIs

#### GET /api/kpis/dashboard
**Permiso:** `KPI:VER`

Query params: `?sucursalId=5`

**Respuesta 200:**
```json
{
  "data": {
    "cashSummary": {
      "efectivoTotalEnCirculacion": 769600,
      "cajasAbiertas": 8,
      "cajasCerradas": 15
    },
    "transactionVolume24h": [
      { "tipo": "EGRESO", "cantidad": 36, "total": 162300 },
      { "tipo": "INGRESO", "cantidad": 54, "total": 718500 }
    ],
    "transactionVolume7d": [...],
    "transactionVolume30d": [...],
    "balanceAlerts": [
      {
        "arqueoId": "12",
        "cajaId": "4",
        "diferencia": "1685.00",
        "fecha": "2026-03-23T01:46:38.058Z"
      }
    ],
    "recentOperations": [
      {
        "accion": "SOLICITUD_RECHAZADA",
        "resumen": "Solicitud rechazada.",
        "fecha": "2026-03-23T01:46:41.229Z",
        "usuario": "Carlos Supervisor"
      }
    ]
  }
}
```

#### POST /api/kpis
**Permiso:** `KPI:CREAR`

```json
{
  "scope": "SUCURSAL",
  "scopeId": "1",
  "metricasJson": {
    "totalIngresos": 50000,
    "totalEgresos": 20000,
    "saldoNeto": 30000,
    "transacciones": 15
  }
}
```

#### GET /api/kpis
**Permiso:** `KPI:VER`

Query params: `?scope=SUCURSAL&scopeId=1&desde=2026-03-01&hasta=2026-03-31`

#### GET /api/kpis/:id
**Permiso:** `KPI:VER`

---

### 12. Auditoría

#### GET /api/auditoria
**Permiso:** `AUDITORIA:VER`

Query params: `?usuarioId=5&accion=MOVIMIENTO_CREADO&entidadTipo=MOVIMIENTO&desde=2026-03-22&hasta=2026-03-23`

**Respuesta 200:**
```json
{
  "data": [
    {
      "id": "169",
      "fecha": "2026-03-23T01:46:42.380Z",
      "usuarioId": "5",
      "accion": "CIERRE_CAJA",
      "entidadTipo": "SESION_CAJA",
      "entidadId": "23",
      "resumen": "Cierre de caja. Esperado: 12700, Real: 5700, Diferencia: 7000",
      "metadata": null,
      "beforeJson": null,
      "afterJson": null
    }
  ]
}
```

Acciones registradas automáticamente:
- `LOGIN`, `LOGOUT`
- `APERTURA_CAJA`, `CIERRE_CAJA`
- `MOVIMIENTO_CREADO`
- `ARQUEO_REALIZADO`
- `SOLICITUD_FONDOS_CREADA`, `SOLICITUD_APROBADA`, `SOLICITUD_RECHAZADA`, `SOLICITUD_EJECUTADA`
- `USUARIO_CREADO`

#### POST /api/auditoria
**Permiso:** `AUDITORIA:CREAR`

```json
{
  "accion": "CREAR",
  "entidadTipo": "USUARIO",
  "entidadId": "1",
  "resumen": "Evento manual de prueba",
  "metadata": "{\"campo\": \"valor\"}",
  "afterJson": "{\"nombre\": \"Test\"}"
}
```

#### GET /api/auditoria/:id
**Permiso:** `AUDITORIA:VER`

---

## Flujo Completo de Ejemplo

```
1. POST /auth/login           → Obtener token
2. POST /cashbox-sessions/open → Abrir caja con saldo inicial
3. POST /movimientos           → Registrar ingresos/egresos
4. POST /arqueos               → Contar denominaciones físicas
5. POST /solicitudes           → Solicitar fondos entre cajas
6. PATCH /solicitudes/:id/resolve → Supervisor aprueba
7. PATCH /solicitudes/:id/execute → Tesorería ejecuta transferencia
8. PATCH /cashbox-sessions/:id/close → Cerrar caja con saldo real
9. GET /kpis/dashboard         → Ver resumen ejecutivo
10. GET /auditoria             → Revisar trazabilidad completa
```

---

Ahí lo tienes. Cubre los 12 módulos con todos los endpoints, bodies, query params, permisos y ejemplos reales basados en las pruebas que corriste.
