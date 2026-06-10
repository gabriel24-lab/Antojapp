-- ============================================================
--  ANTOJAPP — Migración: Soporte global (países y ciudades)
--  Ejecutar en Supabase SQL Editor o con psql
--  Fecha: 2026-06
-- ============================================================

-- ── 1. Agregar columnas pais, ciudad y moneda a negocios ──────
ALTER TABLE negocios
  ADD COLUMN IF NOT EXISTS pais    CHAR(2)      DEFAULT 'CO',
  ADD COLUMN IF NOT EXISTS ciudad  VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS moneda  VARCHAR(3)   DEFAULT 'COP';

-- Actualizar negocios existentes que no tengan país
UPDATE negocios SET pais = 'CO', moneda = 'COP' WHERE pais IS NULL;

-- Índices para filtrar por país/ciudad rápidamente
CREATE INDEX IF NOT EXISTS idx_negocios_pais   ON negocios(pais);
CREATE INDEX IF NOT EXISTS idx_negocios_ciudad ON negocios(ciudad);


-- ── 2. Agregar pais/ciudad a sedes también ────────────────────
ALTER TABLE sedes
  ADD COLUMN IF NOT EXISTS pais   CHAR(2)      DEFAULT 'CO',
  ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100) DEFAULT NULL;


-- ── 3. Negocios de prueba internacionales ─────────────────────

-- México — Ciudad de México
INSERT INTO negocios (nombre, categoria, descripcion, portada, calificacion, total_resenas, etiquetas, activo, pais, ciudad, moneda)
VALUES
  (
    'Tacos El Compadre', 'Tacos y antojitos',
    'Tacos de canasta y al pastor desde 1974. La salsa verde tatemada es receta familiar que no se vende, solo se come aquí.',
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80',
    4.9, 342,
    ARRAY['tacos','al pastor','canasta','antojitos','salsa verde'],
    TRUE, 'MX', 'Ciudad de México', 'MXN'
  ),
  (
    'Pozolería La Guadalupana', 'Caldos y sopas',
    'Pozole rojo de cerdo con receta de Guerrero. Se cocina desde las 4am para que el caldo esté listo a las 10. Imperdible los domingos.',
    'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?w=600&q=80',
    4.7, 198,
    ARRAY['pozole','caldo','cerdo','guerrero','domingo'],
    TRUE, 'MX', 'Ciudad de México', 'MXN'
  ),
  (
    'Elotes y Esquites Doña Chuy', 'Comida callejera',
    'Elotes en vaso y esquites con chile, limón, mayonesa y queso cotija. Destino obligado en Xochimilco desde hace 30 años.',
    'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=600&q=80',
    4.6, 77,
    ARRAY['elotes','esquites','cotija','callejero','xochimilco'],
    TRUE, 'MX', 'Ciudad de México', 'MXN'
  )
ON CONFLICT ON CONSTRAINT uq_negocios_nombre_categoria DO NOTHING;

-- Perú — Lima
INSERT INTO negocios (nombre, categoria, descripcion, portada, calificacion, total_resenas, etiquetas, activo, pais, ciudad, moneda)
VALUES
  (
    'La Cevichería del Puerto', 'Mariscos',
    'Ceviche limeño clásico con leche de tigre preparada al momento. Tres generaciones de familia puertorriqueña en el Callao.',
    'https://images.unsplash.com/photo-1637071487892-3d7cd68d7c2f?w=600&q=80',
    4.9, 521,
    ARRAY['ceviche','leche de tigre','callao','mariscos','limeño'],
    TRUE, 'PE', 'Lima', 'PEN'
  ),
  (
    'Anticuchos Doña Grimanesa', 'Comida callejera',
    'Anticuchos de corazón a la brasa, la receta más famosa de Lima. Cola que vale la pena. Tradición viva en Miraflores desde 1960.',
    'https://images.unsplash.com/photo-1606851091851-e8c8c0fea6b2?w=600&q=80',
    4.8, 890,
    ARRAY['anticuchos','corazón','parrilla','miraflores','noche'],
    TRUE, 'PE', 'Lima', 'PEN'
  )
ON CONFLICT ON CONSTRAINT uq_negocios_nombre_categoria DO NOTHING;

-- España — Madrid
INSERT INTO negocios (nombre, categoria, descripcion, portada, calificacion, total_resenas, etiquetas, activo, pais, ciudad, moneda)
VALUES
  (
    'Bar Pintxos Donostia', 'Tapas y pintxos',
    'Pintxos vascos en pleno Madrid. El de anchoa con pimiento del piquillo y el de gamba al ajillo son nuestra seña de identidad.',
    'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=600&q=80',
    4.7, 267,
    ARRAY['pintxos','tapas','vasco','anchoa','gamba','txakoli'],
    TRUE, 'ES', 'Madrid', 'EUR'
  ),
  (
    'Bocadillería Cascorro', 'Bocadillos y sándwiches',
    'Bocadillos de calamares en su tinta a la madrileña, desde 1952 en el Rastro. El secreto es el aceite de oliva virgen y el pan de barra crujiente.',
    'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=600&q=80',
    4.5, 134,
    ARRAY['bocadillo','calamares','rastro','madrid','tinta'],
    TRUE, 'ES', 'Madrid', 'EUR'
  )
ON CONFLICT ON CONSTRAINT uq_negocios_nombre_categoria DO NOTHING;

-- Japón — Tokio
INSERT INTO negocios (nombre, categoria, descripcion, portada, calificacion, total_resenas, etiquetas, activo, pais, ciudad, moneda)
VALUES
  (
    'Ramen Ichiban', 'Ramen y noodles',
    'Ramen de tonkotsu con caldo de hueso de cerdo cocido 18 horas. El tare de soja tostada lo prepara el chef Tanaka cada mañana.',
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
    4.9, 1203,
    ARRAY['ramen','tonkotsu','noodles','caldo','huevo marinado'],
    TRUE, 'JP', 'Tokio', 'JPY'
  ),
  (
    'Takoyaki Osaka-ya', 'Comida callejera',
    'Takoyaki al estilo Osaka con pulpo fresco, cebollines y jengibre. Salsa especial y katsuobushi encima. Crujientes por fuera, cremosos por dentro.',
    'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=600&q=80',
    4.7, 456,
    ARRAY['takoyaki','pulpo','osaka','callejero','katsuobushi'],
    TRUE, 'JP', 'Tokio', 'JPY'
  )
ON CONFLICT ON CONSTRAINT uq_negocios_nombre_categoria DO NOTHING;

-- Italia — Roma
INSERT INTO negocios (nombre, categoria, descripcion, portada, calificacion, total_resenas, etiquetas, activo, pais, ciudad, moneda)
VALUES
  (
    'Trattoria da Nonna Rosa', 'Pasta y risotto',
    'Pasta fresca al huevo preparada cada mañana. La cacio e pepe de la nonna Rosa sigue la receta romana original: solo queso pecorino, pimienta negra y pasta.',
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80',
    4.8, 389,
    ARRAY['pasta','cacio e pepe','carbonara','amatriciana','trattoria'],
    TRUE, 'IT', 'Roma', 'EUR'
  ),
  (
    'Pizzeria Borghese', 'Pizza',
    'Pizza romana al taglio, fina y crujiente. Masa de 72 horas de fermentación. La margherita con burrata fresca y albahaca del huerto es la favorita del barrio.',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
    4.6, 221,
    ARRAY['pizza','al taglio','romana','burrata','margherita'],
    TRUE, 'IT', 'Roma', 'EUR'
  )
ON CONFLICT ON CONSTRAINT uq_negocios_nombre_categoria DO NOTHING;

-- Estados Unidos — Nueva York
INSERT INTO negocios (nombre, categoria, descripcion, portada, calificacion, total_resenas, etiquetas, activo, pais, ciudad, moneda)
VALUES
  (
    'Katz''s Deli-Style Corner', 'Deli y sándwiches',
    'Pastrami on rye al estilo Lower East Side. Carne curada 10 días, ahumada en horno de ladrillo. El corned beef hash del desayuno agota antes del mediodía.',
    'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=600&q=80',
    4.7, 672,
    ARRAY['pastrami','deli','rye','corned beef','new york'],
    TRUE, 'US', 'Nueva York', 'USD'
  ),
  (
    'Brooklyn Bagel Co.', 'Panadería y desayunos',
    'Bagels hervidos y horneados en piedra al estilo Brooklyn original. El lox and cream cheese con cebolla roja y alcaparras es el favorito de la ciudad.',
    'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&q=80',
    4.5, 445,
    ARRAY['bagel','lox','cream cheese','brooklyn','desayuno'],
    TRUE, 'US', 'Nueva York', 'USD'
  )
ON CONFLICT ON CONSTRAINT uq_negocios_nombre_categoria DO NOTHING;


-- ── 4. Sedes de los negocios internacionales ──────────────────
INSERT INTO sedes (negocio_id, nombre, direccion, telefono, lat, lng, horario, pais, ciudad)
SELECT n.id, s.nombre, s.direccion, s.telefono, s.lat, s.lng, s.horario::jsonb, s.pais, s.ciudad
FROM (VALUES
  ('Tacos El Compadre', 'Puesto Tepito', 'Calle Libertad 22, Tepito, CDMX', '+525512345678', 19.4395, -99.1190,
   '{"lunes":"08:00-15:00","martes":"08:00-15:00","miercoles":"08:00-15:00","jueves":"08:00-15:00","viernes":"08:00-16:00","sabado":"08:00-16:00","domingo":"08:00-14:00"}', 'MX', 'Ciudad de México'),
  ('Pozolería La Guadalupana', 'Local Tepito', 'Av. del Trabajo 110, Col. Morelos, CDMX', '+525598765432', 19.4380, -99.1205,
   '{"lunes":"cerrado","martes":"cerrado","miercoles":"cerrado","jueves":"cerrado","viernes":"12:00-20:00","sabado":"10:00-21:00","domingo":"10:00-18:00"}', 'MX', 'Ciudad de México'),
  ('Elotes y Esquites Doña Chuy', 'Embarcadero Xochimilco', 'Embarcadero Nuevo Nativitas, Xochimilco', '+525567891234', 19.2652, -99.1044,
   '{"lunes":"10:00-19:00","martes":"10:00-19:00","miercoles":"10:00-19:00","jueves":"10:00-19:00","viernes":"10:00-20:00","sabado":"09:00-21:00","domingo":"09:00-21:00"}', 'MX', 'Ciudad de México'),
  ('La Cevichería del Puerto', 'Local Callao', 'Av. Saenz Peña 302, Callao, Lima', '+51015551234', -12.0622, -77.1302,
   '{"lunes":"11:00-17:00","martes":"11:00-17:00","miercoles":"11:00-17:00","jueves":"11:00-17:00","viernes":"11:00-18:00","sabado":"10:00-18:00","domingo":"10:00-16:00"}', 'PE', 'Lima'),
  ('Anticuchos Doña Grimanesa', 'Puesto Miraflores', 'Av. Larco con Av. Díez Canseco, Miraflores', '+51015559876', -12.1231, -77.0308,
   '{"lunes":"cerrado","martes":"cerrado","miercoles":"18:00-23:00","jueves":"18:00-23:00","viernes":"18:00-00:00","sabado":"18:00-00:00","domingo":"18:00-23:00"}', 'PE', 'Lima'),
  ('Bar Pintxos Donostia', 'Bar Malasaña', 'Calle Fuencarral 88, Malasaña, Madrid', '+34911234567', 40.4273, -3.7034,
   '{"lunes":"12:00-00:00","martes":"12:00-00:00","miercoles":"12:00-00:00","jueves":"12:00-01:00","viernes":"12:00-02:00","sabado":"12:00-02:00","domingo":"12:00-23:00"}', 'ES', 'Madrid'),
  ('Bocadillería Cascorro', 'Local El Rastro', 'Plaza de Cascorro 3, La Latina, Madrid', '+34915678901', 40.4098, -3.7085,
   '{"lunes":"cerrado","martes":"10:00-16:00","miercoles":"10:00-16:00","jueves":"10:00-16:00","viernes":"10:00-17:00","sabado":"09:00-17:00","domingo":"09:00-15:00"}', 'ES', 'Madrid'),
  ('Ramen Ichiban', 'Local Shinjuku', '1-2-3 Kabukicho, Shinjuku-ku, Tokyo', '+81335551234', 35.6938, 139.7034,
   '{"lunes":"11:00-23:00","martes":"11:00-23:00","miercoles":"11:00-23:00","jueves":"11:00-23:00","viernes":"11:00-00:00","sabado":"11:00-00:00","domingo":"11:00-22:00"}', 'JP', 'Tokio'),
  ('Takoyaki Osaka-ya', 'Puesto Asakusa', '2-4-1 Asakusa, Taito-ku, Tokyo', '+81335559876', 35.7148, 139.7967,
   '{"lunes":"10:00-20:00","martes":"10:00-20:00","miercoles":"cerrado","jueves":"10:00-20:00","viernes":"10:00-21:00","sabado":"09:00-21:00","domingo":"09:00-20:00"}', 'JP', 'Tokio'),
  ('Trattoria da Nonna Rosa', 'Local Trastevere', 'Vicolo del Cinque 18, Trastevere, Roma', '+390665432100', 41.8895, 12.4698,
   '{"lunes":"12:00-15:00","martes":"12:00-15:00","miercoles":"12:00-15:00","jueves":"12:00-15:00","viernes":"12:00-15:00","sabado":"12:00-23:00","domingo":"12:00-22:00"}', 'IT', 'Roma'),
  ('Pizzeria Borghese', 'Via del Corso', 'Via del Corso 210, Centro Storico, Roma', '+390661234567', 41.9009, 12.4790,
   '{"lunes":"10:00-22:00","martes":"10:00-22:00","miercoles":"10:00-22:00","jueves":"10:00-22:00","viernes":"10:00-23:00","sabado":"10:00-23:00","domingo":"11:00-21:00"}', 'IT', 'Roma'),
  ('Katz''s Deli-Style Corner', 'LES Location', '205 E Houston St, Lower East Side, New York', '+12125554321', 40.7223, -73.9874,
   '{"lunes":"08:00-22:00","martes":"08:00-22:00","miercoles":"08:00-22:00","jueves":"08:00-22:00","viernes":"08:00-23:00","sabado":"08:00-23:00","domingo":"08:00-22:00"}', 'US', 'Nueva York'),
  ('Brooklyn Bagel Co.', 'Williamsburg Store', '388 Bedford Ave, Williamsburg, Brooklyn', '+17185556789', 40.7128, -73.9609,
   '{"lunes":"06:00-14:00","martes":"06:00-14:00","miercoles":"06:00-14:00","jueves":"06:00-14:00","viernes":"06:00-15:00","sabado":"06:00-15:00","domingo":"07:00-13:00"}', 'US', 'Nueva York')
) AS s(negocio_nombre, nombre, direccion, telefono, lat, lng, horario, pais, ciudad)
JOIN negocios n ON n.nombre = s.negocio_nombre
WHERE NOT EXISTS (
  SELECT 1 FROM sedes WHERE negocio_id = n.id AND nombre = s.nombre
);


-- ── 5. Actualizar el endpoint GET /api/negocios para soportar filtro por pais ──
-- NOTA: El filtrado por pais/ciudad se hace en el frontend (LocationSelector).
-- Si quieres filtrar desde el backend, agrega este índice y usa el query param ?pais=MX:
-- Ya creados arriba: idx_negocios_pais, idx_negocios_ciudad
-- El controlador negociosController.js necesitará leer req.query.pais y req.query.ciudad.

-- ── 6. Verificación ───────────────────────────────────────────
SELECT pais, ciudad, COUNT(*) as total
FROM negocios
WHERE activo = TRUE
GROUP BY pais, ciudad
ORDER BY pais, ciudad;
