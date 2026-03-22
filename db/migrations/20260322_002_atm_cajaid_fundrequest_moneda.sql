-- Migración: caja_id en tabla atm + moneda en solicitudfondos
-- Fecha: 2026-03-22

-- ── 1. Agregar caja_id a la tabla atm ───────────────────────────────────────
-- Cada ATM debe estar vinculado a una caja de su sucursal para registrar
-- sus movimientos de efectivo correctamente en movimientoefectivo.
-- NOTA: atm.id y caja.id son integer (int4), NO uuid.

alter table atm
  add column if not exists caja_id integer references caja(id);

-- Índice para búsquedas por caja
create index if not exists ix_atm_caja_id
  on atm (caja_id);

-- NOTA: Actualizar manualmente los registros existentes de ATM con su caja_id:
-- update atm set caja_id = <id-de-caja> where id = <id-de-atm>;
-- Ejemplo: update atm set caja_id = 1 where id = 1;
-- Luego, si se desea obligatorio:
-- alter table atm alter column caja_id set not null;


-- ── 2. Agregar moneda a la tabla solicitudfondos ─────────────────────────────
-- Referencia la tabla `moneda` que ya existe con DOP, USD, EUR.

alter table solicitudfondos
  add column if not exists moneda varchar(3) not null default 'DOP'
  references moneda(codigo);

-- Índice para filtrar solicitudes por moneda
create index if not exists ix_solicitudfondos_moneda
  on solicitudfondos (moneda);


-- ── 3. Agregar moneda a la tabla arqueocaja ──────────────────────────────────
-- Registra con qué divisa se realizó cada arqueo.

alter table arqueocaja
  add column if not exists moneda varchar(3) not null default 'DOP'
  references moneda(codigo);

create index if not exists ix_arqueocaja_moneda
  on arqueocaja (moneda);
