select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'usuario',
    'usuario_credencial',
    'rol',
    'usuario_rol',
    'sesion_usuario'
  )
order by table_name, ordinal_position;