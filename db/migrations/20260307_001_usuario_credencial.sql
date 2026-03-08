create table if not exists usuario_credencial (
  usuario_id integer primary key references usuario(id) on delete cascade,
  password_hash varchar(255) not null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create unique index if not exists uq_usuario_login_lower
  on usuario (lower("username/email"));

create index if not exists ix_usuario_rol_usuario_id
  on usuario_rol (usuario_id);

create index if not exists ix_usuario_rol_rol_id
  on usuario_rol (rol_id);