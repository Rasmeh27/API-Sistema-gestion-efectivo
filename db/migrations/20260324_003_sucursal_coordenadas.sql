-- Agrega coordenadas geográficas a sucursales
ALTER TABLE sucursal
  ADD COLUMN IF NOT EXISTS latitud DECIMAL(10, 7) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS longitud DECIMAL(10, 7) DEFAULT NULL;
