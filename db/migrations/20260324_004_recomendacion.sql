-- Tabla de recomendaciones generadas por IA
CREATE TABLE IF NOT EXISTS recomendacion (
  id            SERIAL PRIMARY KEY,
  tipo          VARCHAR(50)  NOT NULL,         -- ALERTA, OPTIMIZACION, PREVISION, GENERAL
  prioridad     VARCHAR(20)  NOT NULL DEFAULT 'MEDIA', -- ALTA, MEDIA, BAJA
  titulo        VARCHAR(255) NOT NULL,
  descripcion   TEXT         NOT NULL,
  datos_contexto JSONB       DEFAULT '{}',     -- datos usados para generar la recomendación
  estado        VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, LEIDA, DESCARTADA
  sucursal_id   INTEGER      REFERENCES sucursal(id) ON DELETE SET NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recomendacion_estado ON recomendacion(estado);
CREATE INDEX IF NOT EXISTS idx_recomendacion_tipo ON recomendacion(tipo);
CREATE INDEX IF NOT EXISTS idx_recomendacion_created ON recomendacion(created_at DESC);
