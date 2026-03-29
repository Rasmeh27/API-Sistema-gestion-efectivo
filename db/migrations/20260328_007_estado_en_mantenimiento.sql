-- Allow EN_MANTENIMIENTO estado for caja and atm tables.
-- The original CHECK constraints only allowed ACTIVA/INACTIVA (caja) and ACTIVO/INACTIVO (atm).
-- This migration drops the old constraints and recreates them with the additional value.

-- ── Caja ──────────────────────────────────────────────────
-- Drop any existing check constraint on caja.estado (name may vary)
do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where rel.relname = 'caja'
      and nsp.nspname = 'public'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%estado%'
  loop
    execute format('alter table caja drop constraint %I', r.conname);
  end loop;
end $$;

alter table caja
  add constraint caja_estado_check
  check (estado in ('ACTIVA', 'INACTIVA', 'EN_MANTENIMIENTO'));

-- ── ATM ───────────────────────────────────────────────────
do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where rel.relname = 'atm'
      and nsp.nspname = 'public'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%estado%'
  loop
    execute format('alter table atm drop constraint %I', r.conname);
  end loop;
end $$;

alter table atm
  add constraint atm_estado_check
  check (estado in ('ACTIVO', 'INACTIVO', 'EN_MANTENIMIENTO'));
