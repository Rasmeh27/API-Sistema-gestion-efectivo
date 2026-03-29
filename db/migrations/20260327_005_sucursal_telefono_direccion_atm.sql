-- Migración: telefono, direccion y cantidad_atm en sucursal
-- Fecha: 2026-03-27

ALTER TABLE sucursal
  ADD COLUMN IF NOT EXISTS telefono VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS direccion VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cantidad_atm INTEGER NOT NULL DEFAULT 0;
