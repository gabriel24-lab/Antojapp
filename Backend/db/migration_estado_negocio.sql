-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: flujo de verificación de negocios
-- Agrega campo `estado` con valores pendiente / aprobado / rechazado
-- Los negocios existentes pasan a 'aprobado' para no romper producción.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE negocios
  ADD COLUMN IF NOT EXISTS estado VARCHAR(20)
    NOT NULL
    DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aprobado', 'rechazado'));

-- Conservar negocios ya activos como aprobados
UPDATE negocios
  SET estado = 'aprobado'
  WHERE activo = TRUE AND estado = 'pendiente';

-- Índice para que el panel admin filtre rápido por estado
CREATE INDEX IF NOT EXISTS idx_negocios_estado ON negocios(estado);
