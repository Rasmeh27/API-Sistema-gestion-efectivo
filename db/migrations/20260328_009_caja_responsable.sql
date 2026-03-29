-- Agrega responsable opcional por caja.
-- Reglas de negocio (activo y misma sucursal) se validan en backend.

alter table caja
  add column if not exists responsable_id integer null references usuario(id);

create index if not exists ix_caja_responsable_id
  on caja (responsable_id);
