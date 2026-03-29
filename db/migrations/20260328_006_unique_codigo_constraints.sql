-- Add UNIQUE constraints on codigo columns for sucursal, caja, and atm.
-- Uses CREATE UNIQUE INDEX IF NOT EXISTS for idempotency.

create unique index if not exists uq_sucursal_codigo
  on sucursal (lower(codigo));

create unique index if not exists uq_caja_codigo
  on caja (lower(codigo));

create unique index if not exists uq_atm_codigo
  on atm (lower(codigo));
