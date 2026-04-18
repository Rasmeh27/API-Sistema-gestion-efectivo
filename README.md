# Sistema de Gestion de Efectivo Bancario - API REST

<p align="center">
  API backend para la gestion integral de efectivo en sucursales bancarias. Administra cajas, sesiones, movimientos de efectivo, arqueos, solicitudes de fondos, ATMs, auditoria, KPIs y recomendaciones inteligentes con IA.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Express.js-4.x-000000?logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/JWT-Auth-orange?logo=jsonwebtokens&logoColor=white" alt="JWT">
</p>

---

## Tabla de Contenidos

- [Tecnologias](#tecnologias)
- [Arquitectura](#arquitectura)
- [Requisitos Previos](#requisitos-previos)
- [Instalacion](#instalacion)
- [Variables de Entorno](#variables-de-entorno)
- [Base de Datos](#base-de-datos)
- [Autenticacion y Autorizacion](#autenticacion-y-autorizacion)
- [Modulos del Sistema](#modulos-del-sistema)
- [Endpoints de la API](#endpoints-de-la-api)
  - [Auth](#1-auth-publico)
  - [Usuarios](#2-usuarios)
  - [Roles](#3-roles)
  - [Sucursales](#4-sucursales)
  - [Cajas](#5-cajas)
  - [Sesiones de Caja](#6-sesiones-de-caja)
  - [Movimientos de Efectivo](#7-movimientos-de-efectivo)
  - [Arqueos de Caja](#8-arqueos-de-caja)
  - [ATMs](#9-atms)
  - [Solicitudes de Fondos](#10-solicitudes-de-fondos)
  - [Auditoria](#11-auditoria)
  - [KPIs y Dashboard](#12-kpis-y-dashboard)
  - [Recomendaciones IA](#13-recomendaciones-ia)
- [Formato de Errores](#formato-de-errores)
- [Usuarios de Prueba](#usuarios-de-prueba)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Flujo Completo de Ejemplo](#flujo-completo-de-ejemplo)

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| **Node.js + TypeScript** | Runtime y lenguaje (strict mode, ES2022) |
| **Express.js** | Framework HTTP |
| **PostgreSQL** | Base de datos relacional |
| **JWT (jsonwebtoken)** | Autenticacion con access + refresh tokens |
| **bcryptjs** | Hashing de contrasenas (cost factor 12) |
| **HuggingFace Inference API** | Recomendaciones inteligentes con IA (Qwen2.5-72B) |
| **Jest + ts-jest** | Testing unitario |
| **tsx** | Ejecucion directa de TypeScript en desarrollo |

---

## Arquitectura

El proyecto sigue un **patron modular con Repository Pattern** y separacion de responsabilidades:

```
Request → Middleware (Auth + RBAC) → Controller → Service → Repository → PostgreSQL
```

**Cada modulo implementa:**

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Controller | `*.controller.ts` | Manejo de requests/responses HTTP |
| Service | `*.service.ts` | Logica de negocio y validaciones |
| Repository | `*.repository.ts` | Interfaz abstracta de acceso a datos |
| Implementacion | `*.postgres-repository.ts` | Queries SQL y transacciones |
| DTOs | `*.dto.ts` | Validacion y tipado de entrada/salida |
| Errores | `*.errors.ts` | Errores personalizados por dominio |
| Rutas | `*.routes.ts` | Definicion de endpoints y middlewares |
| Tests | `*.service.test.ts` | Tests unitarios del servicio |

---

## Requisitos Previos

- **Node.js** >= 18
- **PostgreSQL** >= 14
- **npm** o **yarn**

---

## Instalacion

```bash
# 1. Clonar el repositorio
git clone https://github.com/Rasmeh27/API-Sistema-gestion-efectivo.git
cd API-Sistema-gestion-efectivo

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores (ver seccion Variables de Entorno)

# 4. Ejecutar migraciones
npm run migrate

# 5. (Opcional) Cargar datos de prueba
npm run seed

# 6. Iniciar en desarrollo
npm run dev
```

El servidor estara disponible en `http://localhost:3000` (o el puerto configurado).

---

## Variables de Entorno

Crear archivo `.env` en la raiz del proyecto:

| Variable | Tipo | Default | Descripcion |
|---|---|---|---|
| `NODE_ENV` | string | `development` | Modo de ejecucion (`development` / `production` / `test`) |
| `PORT` | number | `3000` | Puerto del servidor |
| `DATABASE_URL` | string | **Requerido** | URL de conexion PostgreSQL (`postgresql://user:pass@host:5432/db`) |
| `DB_SSL` | boolean | `true` | Habilitar SSL en la conexion a BD |
| `DB_POOL_MAX` | number | `10` | Maximo de conexiones en el pool |
| `DB_IDLE_TIMEOUT_MS` | number | `10000` | Timeout de inactividad de conexion (ms) |
| `DB_CONNECTION_TIMEOUT_MS` | number | `10000` | Timeout de conexion (ms) |
| `JWT_SECRET` | string | **Requerido** | Secreto para firmar tokens JWT |
| `JWT_EXPIRES_IN` | string | `15m` | Tiempo de expiracion del access token |
| `JWT_REFRESH_EXPIRES_DAYS` | number | `7` | Dias de validez del refresh token |
| `ALLOW_BOOTSTRAP` | boolean | `false` | Habilitar endpoints de configuracion inicial |
| `CORS_ALLOWED_ORIGINS` | string | `http://localhost:5173` | Origenes CORS permitidos (separados por coma) |
| `HF_TOKEN` | string | Opcional | Token de HuggingFace (para recomendaciones IA) |
| `HF_MODEL` | string | `Qwen/Qwen2.5-72B-Instruct` | Modelo LLM a utilizar |

**Ejemplo de `.env`:**

```env
PORT=3000
DATABASE_URL=postgresql://usuario:password@localhost:5432/gestion_efectivo
DB_SSL=false
JWT_SECRET=mi_secreto_super_seguro
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_DAYS=7
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxx
```

---

## Base de Datos

### Esquema de Tablas

```
usuario                 -- Usuarios del sistema
usuario_credencial      -- Hashes de contrasenas (bcrypt)
rol                     -- Roles (CAJERO, SUPERVISOR, TESORERIA, AUDITOR, ADMIN)
permiso                 -- Permisos individuales (recurso + accion)
usuariorol              -- Relacion N:N usuario-rol
rolpermiso              -- Relacion N:N rol-permiso
sucursal                -- Sucursales con geolocalizacion
caja                    -- Cajas registradoras (multi-moneda)
sesioncaja              -- Sesiones de apertura/cierre de caja
movimientoefectivo      -- Movimientos de efectivo (ingresos, egresos, transferencias)
arqueocaja              -- Arqueos de caja (conteo fisico vs esperado)
solicitudfondos         -- Solicitudes de fondos entre cajas/sucursales
atm                     -- Cajeros automaticos
moneda                  -- Monedas soportadas (DOP, USD, EUR)
recomendacion           -- Recomendaciones generadas por IA
auditlog                -- Registro completo de auditoria
```

### Migraciones

Las migraciones SQL se encuentran en `db/migrations/` y se ejecutan secuencialmente:

```bash
npm run migrate
```

| Migracion | Descripcion |
|---|---|
| `001_usuario_credencial.sql` | Esquema inicial (usuarios, roles, permisos, cajas, movimientos) |
| `002_atm_cajaid_fundrequest_moneda.sql` | ATMs, multi-moneda, solicitudes de fondos |
| `003_sucursal_coordenadas.sql` | Coordenadas geograficas en sucursales |
| `004_recomendacion.sql` | Tabla de recomendaciones IA |
| `005_sucursal_telefono_direccion_atm.sql` | Telefono y direccion en sucursales |
| `006_unique_codigo_constraints.sql` | Indices unicos en codigos |
| `007_estado_en_mantenimiento.sql` | Estado EN_MANTENIMIENTO |
| `008_estado_varchar_length.sql` | Ampliacion de varchar para estados |
| `009_caja_responsable.sql` | Responsable asignado a cada caja |

### Seed de Datos

El seed es **idempotente** (seguro de ejecutar multiples veces):

```bash
npm run seed
```

Crea:
- 3 monedas: DOP, USD, EUR
- 5 roles con 112 permisos asignados
- 3 sucursales (Centro, Norte, Este) con coordenadas
- 4 cajas en diferentes monedas
- 3 ATMs
- 6 usuarios de prueba
- Sesiones, movimientos, solicitudes de fondos y arqueos de ejemplo

---

## Autenticacion y Autorizacion

### Sistema JWT (Doble Token)

| Token | Duracion | Uso |
|---|---|---|
| **Access Token** | 15 min (configurable) | Se envia en cada request protegido |
| **Refresh Token** | 7 dias (configurable) | Permite obtener nuevos tokens sin re-login |

**Header requerido en endpoints protegidos:**
```
Authorization: Bearer <access_token>
```

**Payload del access token:**
```json
{
  "sub": "user-uuid",
  "email": "usuario@banco.com",
  "roles": ["ADMIN"],
  "permissions": ["USUARIOS:VER", "USUARIOS:CREAR", "CAJAS:VER", ...]
}
```

### Flujo de Autenticacion

```
1. POST /api/auth/login         → Obtener accessToken + refreshToken
2. Usar accessToken en headers  → Authorization: Bearer <token>
3. POST /api/auth/refresh        → Renovar tokens (rotacion automatica)
4. POST /api/auth/logout         → Revocar sesion actual
5. POST /api/auth/logout-all     → Revocar todas las sesiones del usuario
```

### RBAC (Control de Acceso Basado en Roles)

**5 Roles predefinidos:**

| Rol | Descripcion |
|---|---|
| `CAJERO` | Operaciones basicas de caja |
| `SUPERVISOR` | Supervision, arqueos y aprobaciones |
| `TESORERIA` | Gestion de fondos y movimientos |
| `AUDITOR` | Solo lectura y exportacion |
| `ADMIN` | Acceso completo al sistema |

**14 Recursos protegidos:**

```
USUARIOS  ROLES  PERMISOS  SUCURSALES  CAJAS  SESION_CAJA  MOVIMIENTOS
TESORERIA  SOLICITUDES  AUDITORIA  PARAMETROS  KPI  RECOMENDACIONES  ARQUEOS
```

**8 Acciones disponibles:**

```
VER  CREAR  EDITAR  ELIMINAR  APROBAR  CERRAR  EXPORTAR  ADMIN
```

Los permisos se expresan como `RECURSO:ACCION` (ej: `CAJAS:CREAR`, `SOLICITUDES:APROBAR`).

---

## Modulos del Sistema

| Modulo | Descripcion |
|---|---|
| **Auth** | Login, refresh de tokens, logout individual y global |
| **Users** | CRUD de usuarios, asignacion de roles, cambio de estado |
| **Roles** | Gestion de roles y asignacion granular de permisos |
| **Sucursales** | Administracion de sucursales con geolocalizacion, telefono y direccion |
| **Cashboxes** | Gestion de cajas con estados, moneda, limite operativo y responsable |
| **Cashbox Sessions** | Apertura y cierre de sesiones con saldo inicial/final y diferencias |
| **Cash Movements** | Registro de transacciones: INGRESO, EGRESO, TRANSFERENCIA, REABASTECIMIENTO |
| **Cashbox Audits** | Conteo fisico vs saldo esperado, con denominaciones multi-moneda |
| **Fund Requests** | Flujo de solicitudes PENDIENTE → APROBADA/RECHAZADA → EJECUTADA |
| **ATM** | Gestion de cajeros automaticos vinculados a sucursales y cajas |
| **Audit** | Registro completo de acciones con snapshots before/after en JSON |
| **KPIs** | Dashboard en tiempo real, tendencias, promedios y distribucion geografica |
| **Recommendations** | Recomendaciones inteligentes con IA (HuggingFace) y chat interactivo |

---

## Endpoints de la API

### 1. Auth (Publico)

**Base:** `/api/auth`

#### POST /api/auth/login

```json
// Request
{
  "email": "admin@banco.com",
  "password": "Test1234!"
}

// Response 200
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "f73e8ce0ac...",
    "expiresIn": 900
  }
}
```

#### POST /api/auth/refresh

```json
// Request
{ "refreshToken": "f73e8ce0ac..." }

// Response 200 — Mismo formato que login (tokens nuevos)
```

#### POST /api/auth/logout

```json
// Request
{ "refreshToken": "f73e8ce0ac..." }

// Response 204 No Content
```

#### POST /api/auth/logout-all

**Permiso:** `USUARIOS:ADMIN` — Sin body.

```json
// Response 200
{ "data": { "revokedSessions": 3 } }
```

---

### 2. Usuarios

**Base:** `/api/users`

| Metodo | Ruta | Permiso | Descripcion |
|---|---|---|---|
| `GET` | `/` | `USUARIOS:VER` | Listar usuarios |
| `POST` | `/` | `USUARIOS:CREAR` | Crear usuario |
| `GET` | `/:id` | `USUARIOS:VER` | Obtener usuario por ID |
| `PATCH` | `/:id` | `USUARIOS:EDITAR` | Actualizar usuario |
| `PATCH` | `/:id/status` | `USUARIOS:EDITAR` | Cambiar estado (ACTIVO/BLOQUEADO) |

**Crear usuario:**
```json
{
  "email": "nuevo@banco.com",
  "name": "Juan Perez",
  "password": "MiPassword123!",
  "roleIds": [4],
  "sucursalDefaultId": "1"
}
```

**Query params para listar:** `?page=1&perPage=20&status=ACTIVO&roleIds=4`

---

### 3. Roles

**Base:** `/api/roles`

| Metodo | Ruta | Permiso | Descripcion |
|---|---|---|---|
| `GET` | `/` | `ROLES:VER` | Listar roles con permisos |
| `POST` | `/` | `ROLES:CREAR` | Crear rol |
| `GET` | `/:id` | `ROLES:VER` | Obtener rol por ID |
| `PATCH` | `/:id` | `ROLES:EDITAR` | Actualizar rol y permisos |
| `DELETE` | `/:id` | `ROLES:ELIMINAR` | Eliminar rol |

**Crear rol:**
```json
{
  "nombre": "GESTOR",
  "permissionsIds": ["47", "48", "49"]
}
```

---

### 4. Sucursales

**Base:** `/api/sucursales`

| Metodo | Ruta | Permiso | Descripcion |
|---|---|---|---|
| `GET` | `/` | `SUCURSALES:VER` | Listar sucursales |
| `POST` | `/` | `SUCURSALES:CREAR` | Crear sucursal |
| `GET` | `/:id` | `SUCURSALES:VER` | Obtener sucursal |
| `PATCH` | `/:id` | `SUCURSALES:EDITAR` | Actualizar sucursal |
| `DELETE` | `/:id` | `SUCURSALES:ELIMINAR` | Eliminar sucursal |

**Crear sucursal:**
```json
{
  "codigo": "SOE",
  "nombre": "Sucursal Oeste",
  "estado": "ACTIVA",
  "latitud": 18.4861,
  "longitud": -69.9312,
  "telefono": "809-555-0100",
  "direccion": "Av. Principal #123",
  "cantidadAtm": 2
}
```

---

### 5. Cajas

**Base:** `/api/cashboxes`

| Metodo | Ruta | Permiso | Descripcion |
|---|---|---|---|
| `GET` | `/` | `CAJAS:VER` | Listar cajas |
| `POST` | `/` | `CAJAS:CREAR` | Crear caja |
| `GET` | `/:id` | `CAJAS:VER` | Obtener caja |
| `PATCH` | `/:id` | `CAJAS:EDITAR` | Actualizar caja |
| `DELETE` | `/:id` | `CAJAS:ELIMINAR` | Eliminar caja |

**Estados:** `ACTIVA` | `INACTIVA` | `EN_MANTENIMIENTO`
**Monedas:** `DOP` | `USD` | `EUR`

**Crear caja:**
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

---

### 6. Sesiones de Caja

**Base:** `/api/cashbox-sessions`

| Metodo | Ruta | Permiso | Descripcion |
|---|---|---|---|
| `POST` | `/open` | `SESION_CAJA:CREAR` | Abrir sesion de caja |
| `PATCH` | `/:id/close` | `SESION_CAJA:CERRAR` | Cerrar sesion de caja |
| `GET` | `/` | `SESION_CAJA:VER` | Listar sesiones |
| `GET` | `/:id` | `SESION_CAJA:VER` | Obtener detalle de sesion |

**Abrir sesion:**
```json
// Request
{ "cajaId": "4", "saldoInicial": 5000 }

// Response 201
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

**Cerrar sesion:**
```json
// Request
{ "saldoFinalReal": 5700 }

// Response 200
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

**Query params:** `?cajaId=4&estado=ABIERTA&page=1&perPage=20`

---

### 7. Movimientos de Efectivo

**Base:** `/api/movimientos`

| Metodo | Ruta | Permiso | Descripcion |
|---|---|---|---|
| `GET` | `/` | `MOVIMIENTOS:VER` | Listar movimientos |
| `POST` | `/` | `MOVIMIENTOS:CREAR` | Registrar movimiento |
| `GET` | `/:id` | `MOVIMIENTOS:VER` | Obtener movimiento |
| `PATCH` | `/:id/void` | `MOVIMIENTOS:EDITAR` | Anular movimiento |

**Tipos de movimiento:**

| Tipo | Descripcion | Campos requeridos |
|---|---|---|
| `INGRESO` | Entrada de efectivo | `cajaId`, `sesionCajaId` |
| `EGRESO` | Salida de efectivo | `cajaId`, `sesionCajaId` |
| `TRANSFERENCIA` | Entre cajas | `cajaOrigenId`, `cajaDestinoId` |
| `REABASTECIMIENTO` | Recarga de caja | `cajaDestinoId` |

**Registrar movimiento:**
```json
{
  "tipo": "INGRESO",
  "medio": "EFECTIVO",
  "monto": 2000,
  "moneda": "USD",
  "referencia": "DEP-001",
  "observacion": "Deposito cliente",
  "cajaId": "4",
  "sesionCajaId": "23"
}
```

**Query params:** `?sesionCajaId=23&cajaId=4&tipo=INGRESO&moneda=USD`

---

### 8. Arqueos de Caja

**Base:** `/api/arqueos`

| Metodo | Ruta | Permiso | Descripcion |
|---|---|---|---|
| `GET` | `/` | `ARQUEOS:VER` | Listar arqueos |
| `POST` | `/` | `ARQUEOS:CREAR` | Crear arqueo (conteo fisico) |
| `GET` | `/:id` | `ARQUEOS:VER` | Obtener detalle de arqueo |

El `saldoContado` se calcula automaticamente a partir de las denominaciones. La `diferencia` = `saldoContado - saldoEsperado`.

**Denominaciones por moneda:**

| DOP | USD | EUR |
|---|---|---|
| `billete2000`, `billete1000` | `billete100`, `billete50` | `billete500`, `billete200` |
| `billete500`, `billete200` | `billete20`, `billete10` | `billete100`, `billete50` |
| `billete100`, `billete50` | `billete5`, `billete1` | `billete20`, `billete10`, `billete5` |
| `moneda25`, `moneda10` | `moneda025` | `moneda2`, `moneda1` |
| `moneda5`, `moneda1` | | `moneda050`, `moneda020` |

**Ejemplo arqueo DOP:**
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
  "observaciones": "Arqueo turno manana"
}
```

---

### 9. ATMs

**Base:** `/api/atm`

| Metodo | Ruta | Permiso | Descripcion |
|---|---|---|---|
| `GET` | `/` | `ATM:VER` | Listar ATMs |
| `POST` | `/` | `ATM:CREAR` | Crear ATM |
| `GET` | `/:id` | `ATM:VER` | Obtener ATM |
| `PATCH` | `/:id` | `ATM:EDITAR` | Actualizar ATM |
| `POST` | `/:id/deposit` | `MOVIMIENTOS:CREAR` | Depositar en ATM |
| `POST` | `/:id/withdraw` | `MOVIMIENTOS:CREAR` | Retirar de ATM |

**Estados:** `ACTIVO` | `INACTIVO` | `EN_MANTENIMIENTO`

**Depositar en ATM:**
```json
{
  "monto": 50000,
  "motivo": "Recarga ATM",
  "sesionCajaId": "13"
}
```

> Los depositos generan un movimiento INGRESO y los retiros un EGRESO en la caja vinculada al ATM.

---

### 10. Solicitudes de Fondos

**Base:** `/api/solicitudes`

| Metodo | Ruta | Permiso | Descripcion |
|---|---|---|---|
| `GET` | `/` | `SOLICITUDES:VER` | Listar solicitudes |
| `POST` | `/` | `SOLICITUDES:CREAR` | Crear solicitud |
| `GET` | `/:id` | `SOLICITUDES:VER` | Obtener solicitud |
| `PATCH` | `/:id/resolve` | `SOLICITUDES:APROBAR` | Aprobar o rechazar |
| `PATCH` | `/:id/execute` | `SOLICITUDES:APROBAR` | Ejecutar transferencia |
| `GET` | `/:id/approval` | `SOLICITUDES:VER` | Ver detalles de aprobacion |

**Flujo de estados:**
```
PENDIENTE → APROBADA → EJECUTADA
          → RECHAZADA
```

**Prioridades:** `BAJA` | `MEDIA` | `ALTA` | `URGENTE`

**Crear solicitud:**
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

**Aprobar/Rechazar:**
```json
// Aprobar
{ "decision": "APROBADA", "comentario": "Aprobado, necesidad confirmada" }

// Rechazar
{ "decision": "RECHAZADA", "motivoRechazo": "Monto excesivo" }
```

> Al ejecutar una solicitud aprobada se generan 2 movimientos automaticos (EGRESO en origen + INGRESO en destino).

---

### 11. Auditoria

**Base:** `/api/auditoria`

| Metodo | Ruta | Permiso | Descripcion |
|---|---|---|---|
| `GET` | `/` | `AUDITORIA:VER` | Listar registros de auditoria |
| `POST` | `/` | `AUDITORIA:CREAR` | Crear registro manual |
| `GET` | `/:id` | `AUDITORIA:VER` | Obtener registro |

**Query params:** `?usuarioId=5&accion=MOVIMIENTO_CREADO&entidadTipo=MOVIMIENTO&desde=2026-03-22&hasta=2026-03-23`

**Acciones registradas automaticamente:**

| Accion | Trigger |
|---|---|
| `LOGIN` / `LOGOUT` | Autenticacion |
| `APERTURA_CAJA` / `CIERRE_CAJA` | Sesiones de caja |
| `MOVIMIENTO_CREADO` | Nuevo movimiento |
| `ARQUEO_REALIZADO` | Nuevo arqueo |
| `SOLICITUD_FONDOS_CREADA` | Nueva solicitud |
| `SOLICITUD_APROBADA` / `SOLICITUD_RECHAZADA` | Resolucion de solicitud |
| `SOLICITUD_EJECUTADA` | Ejecucion de transferencia |
| `USUARIO_CREADO` | Nuevo usuario |

---

### 12. KPIs y Dashboard

**Base:** `/api/kpis`

| Metodo | Ruta | Permiso | Descripcion |
|---|---|---|---|
| `GET` | `/dashboard` | `KPI:VER` | Dashboard con metricas en tiempo real |
| `GET` | `/trends` | `KPI:VER` | Tendencias (agrupadas por dia/semana/mes) |
| `GET` | `/average-balance` | `KPI:VER` | Promedio de saldos por caja |
| `GET` | `/geographic` | `KPI:VER` | Distribucion geografica del efectivo |

**Dashboard (GET /api/kpis/dashboard):**
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
    "transactionVolume7d": [],
    "transactionVolume30d": [],
    "balanceAlerts": [],
    "recentOperations": []
  }
}
```

**Query params:** `?sucursalId=5` (filtrar por sucursal)

**Tendencias:** `?from=2026-03-01&to=2026-03-31&groupBy=day&sucursalId=5`
- `groupBy`: `day` | `week` | `month`

---

### 13. Recomendaciones IA

**Base:** `/api/recomendaciones`

| Metodo | Ruta | Permiso | Descripcion |
|---|---|---|---|
| `GET` | `/` | `RECOMENDACIONES:VER` | Listar recomendaciones |
| `GET` | `/:id` | `RECOMENDACIONES:VER` | Obtener recomendacion |
| `POST` | `/generate` | `RECOMENDACIONES:CREAR` | Generar recomendaciones con IA |
| `POST` | `/chat` | `RECOMENDACIONES:VER` | Chat interactivo con contexto |
| `PATCH` | `/:id` | `RECOMENDACIONES:EDITAR` | Actualizar estado |

**Tipos:** `ALERTA` | `OPTIMIZACION` | `PREVISION` | `GENERAL`
**Prioridad:** `ALTA` | `MEDIA` | `BAJA`
**Estado:** `PENDIENTE` | `LEIDA` | `DESCARTADA`

**Chat interactivo:**
```json
// Request
{
  "message": "Como puedo optimizar el flujo de efectivo en la sucursal Centro?",
  "sucursalId": "5"
}

// Response 200
{
  "data": {
    "reply": "Basado en los KPIs actuales...",
    "context": { ... }
  }
}
```

> La IA utiliza datos de KPIs en tiempo real para contextualizar las recomendaciones. Requiere configurar `HF_TOKEN` en las variables de entorno.

---

## Formato de Errores

Todas las respuestas de error siguen el formato:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Descripcion del error"
  }
}
```

| Codigo HTTP | Significado |
|---|---|
| `200` | OK |
| `201` | Recurso creado |
| `204` | Sin contenido (DELETE/Logout exitoso) |
| `400` | Error de validacion |
| `401` | No autenticado (token faltante o invalido) |
| `403` | Sin permisos (rol/permiso insuficiente) |
| `404` | Recurso no encontrado |
| `409` | Conflicto (recurso duplicado) |
| `500` | Error interno del servidor |

---

## Usuarios de Prueba

Disponibles al ejecutar `npm run seed`. Contrasena para todos: **`Test1234!`**

| Email | Rol | Sucursal Default |
|---|---|---|
| `admin@banco.com` | ADMIN | — |
| `supervisor@banco.com` | SUPERVISOR | Centro |
| `cajero@banco.com` | CAJERO | Centro |
| `cajero2@banco.com` | CAJERO | Norte |
| `tesoreria@banco.com` | TESORERIA | — |
| `auditor@banco.com` | AUDITOR | — |

---

## Scripts Disponibles

```bash
npm run dev            # Servidor en desarrollo (tsx, hot reload)
npm run build          # Compilar TypeScript a dist/
npm start              # Ejecutar build de produccion
npm run migrate        # Ejecutar migraciones de base de datos
npm run seed           # Cargar datos de prueba (idempotente)
npm test               # Ejecutar todos los tests con Jest
npm run test:users     # Tests del modulo de usuarios
npm run test:flow      # Test de flujo de integracion completo
```

---

## Estructura del Proyecto

```
├── src/
│   ├── app/
│   │   ├── app.ts                        # Factory de Express, CORS, middlewares
│   │   └── routes.ts                     # Agregador de todas las rutas
│   ├── config/
│   │   ├── env.ts                        # Validacion de variables de entorno
│   │   └── rbac.ts                       # Recursos, acciones y roles del RBAC
│   ├── middlewares/
│   │   ├── auth.middleware.ts            # Verificacion JWT (requireAuth)
│   │   ├── rbac.middleware.ts            # Permisos y roles (requirePermission/requireRole)
│   │   ├── error.middleware.ts           # Manejo global de errores
│   │   └── audit.middleware.ts           # Middleware de auditoria
│   └── shared/
│       ├── types/request.d.ts            # Tipado de AuthContext en Express
│       ├── errors/AppError.ts            # Clase de error personalizada
│       └── utils/                        # Utilidades (fecha, moneda)
│
├── modules/
│   ├── auth/                             # Autenticacion (login, tokens, sesiones)
│   ├── users/                            # Gestion de usuarios
│   ├── roles/                            # Roles y permisos
│   ├── sucursales/                       # Sucursales
│   ├── cashboxes/                        # Cajas registradoras
│   ├── cashbox-sessions/                 # Sesiones de caja
│   ├── cash-movements/                   # Movimientos de efectivo
│   ├── cashbox-audits/                   # Arqueos de caja
│   ├── fund-requests/                    # Solicitudes de fondos
│   ├── atm/                              # Cajeros automaticos
│   ├── audit/                            # Registro de auditoria
│   ├── kpis/                             # Dashboard y analiticas
│   └── recommendations/                  # Recomendaciones IA (HuggingFace)
│
├── db/
│   ├── index.ts                          # Pool de PostgreSQL y utilidades
│   ├── migrate.ts                        # Runner de migraciones
│   ├── migrations/                       # Archivos SQL de migracion
│   └── seeds/seed.ts                     # Generador de datos de prueba
│
├── scripts/tests/                        # Scripts de testing
├── jest.config.js                        # Configuracion de Jest
├── tsconfig.json                         # Configuracion de TypeScript (strict, ES2022)
├── package.json                          # Dependencias y scripts
└── .env.example                          # Plantilla de variables de entorno
```

---

## Flujo Completo de Ejemplo

```
 1. POST /api/auth/login                    → Autenticarse y obtener token
 2. POST /api/cashbox-sessions/open         → Abrir caja con saldo inicial
 3. POST /api/movimientos                   → Registrar ingresos y egresos
 4. POST /api/arqueos                       → Realizar conteo fisico de denominaciones
 5. POST /api/solicitudes                   → Solicitar fondos entre cajas
 6. PATCH /api/solicitudes/:id/resolve      → Supervisor aprueba la solicitud
 7. PATCH /api/solicitudes/:id/execute      → Tesoreria ejecuta la transferencia
 8. PATCH /api/cashbox-sessions/:id/close   → Cerrar caja con saldo real
 9. GET /api/kpis/dashboard                 → Consultar metricas del dashboard
10. POST /api/recomendaciones/generate      → Obtener recomendaciones de la IA
11. GET /api/auditoria                      → Revisar trazabilidad completa
```

---

## Licencia

Este proyecto es de uso privado.
