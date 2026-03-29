-- Widen estado columns to accommodate 'EN_MANTENIMIENTO' (17 chars).
-- caja.estado and atm.estado were varchar(10), which is too short.

alter table caja alter column estado type varchar(20);
alter table atm alter column estado type varchar(20);
