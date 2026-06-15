-- ============================================================
--  ANTOJAPP — Script de base de datos (versión actualizada)
--  Ejecutar en el SQL Editor de Supabase o con:
--  psql -d antojapp -f schema.sql
-- ============================================================


-- ── 1. USUARIOS ───────────────────────────────────────────────
--  - Soporta registro con email/password Y con Google OAuth
--  - rol: 'usuario' (cliente) | 'negocio' (propietario)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  password    VARCHAR(255),                     -- NULL cuando es login con Google
  es_google   BOOLEAN       DEFAULT FALSE,
  rol         VARCHAR(20)   NOT NULL DEFAULT 'usuario'
                            CHECK (rol IN ('usuario', 'negocio')),
  -- token_version: se incrementa para revocar todos los JWT emitidos
  -- previamente (logout global, cambio de password, baneo de cuenta).
  token_version INTEGER     NOT NULL DEFAULT 1,
  -- URL pública de la foto de perfil (Supabase Storage, bucket "usuarios").
  -- NULL = usar avatar de iniciales por defecto en el frontend.
  foto_perfil VARCHAR(500),
  creado_en   TIMESTAMP     DEFAULT NOW()
);


-- ── 2. NEGOCIOS ───────────────────────────────────────────────
--  - portada e icono: URLs públicas de Supabase Storage
--  - fotos: array de URLs adicionales
--  - etiquetas: array de strings para búsqueda full-text
--  - maps_url / whatsapp / instagram: links de contacto opcionales
--  - activo: permite ocultar un negocio sin eliminarlo
--  - propietario_id: FK al usuario con rol='negocio'
--  - UNIQUE (nombre, categoria): evita duplicados si el schema
--    se vuelve a ejecutar accidentalmente
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS negocios (
  id              SERIAL PRIMARY KEY,
  propietario_id  INTEGER       REFERENCES usuarios(id) ON DELETE SET NULL,
  nombre          VARCHAR(150)  NOT NULL,
  categoria       VARCHAR(100)  NOT NULL,
  descripcion     TEXT          DEFAULT '',
  portada         TEXT,                         -- URL imagen de portada
  icono           TEXT,                         -- URL icono/logo
  fotos           TEXT[]        DEFAULT '{}',   -- array de URLs extra
  calificacion    NUMERIC(3,1)  DEFAULT 0,
  total_resenas   INTEGER       DEFAULT 0,
  etiquetas       TEXT[]        DEFAULT '{}',
  maps_url        TEXT,
  whatsapp        TEXT,
  instagram       TEXT,
  activo          BOOLEAN       DEFAULT TRUE,
  creado_en       TIMESTAMP     DEFAULT NOW(),
  CONSTRAINT uq_negocios_nombre_categoria UNIQUE (nombre, categoria)
);

-- Índice para búsquedas por propietario (panel) y por categoría
CREATE INDEX IF NOT EXISTS idx_negocios_propietario ON negocios(propietario_id);
CREATE INDEX IF NOT EXISTS idx_negocios_categoria   ON negocios(categoria);
CREATE INDEX IF NOT EXISTS idx_negocios_activo      ON negocios(activo);


-- ── 3. SEDES ──────────────────────────────────────────────────
--  - Un negocio puede tener una o varias sedes
--  - horario: JSONB { lunes: "11:00-22:00", ..., domingo: "cerrado" }
--  - maps_url: link directo a Google Maps para esta sede
--  - referencia: indicación extra ("frente al parque", etc.)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sedes (
  id          SERIAL PRIMARY KEY,
  negocio_id  INTEGER       NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  nombre      VARCHAR(150)  NOT NULL,
  direccion   VARCHAR(255),
  telefono    VARCHAR(20),
  lat         NUMERIC(9,6),
  lng         NUMERIC(9,6),
  horario     JSONB,                            -- { lunes: "11:00-22:00", ... }
  maps_url    TEXT,
  referencia  TEXT
);

CREATE INDEX IF NOT EXISTS idx_sedes_negocio ON sedes(negocio_id);


-- ── 4. PLATOS ─────────────────────────────────────────────────
--  - tipo: estrella | economico | premium | menu
--  - foto: URL de Supabase Storage (bucket 'platos')
--  - disponible: permite ocultar temporalmente un plato
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platos (
  id          SERIAL PRIMARY KEY,
  negocio_id  INTEGER       NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  nombre      VARCHAR(150)  NOT NULL,
  descripcion TEXT          DEFAULT '',
  tipo        VARCHAR(20)   NOT NULL
              CHECK (tipo IN ('estrella', 'economico', 'premium', 'menu')),
  precio      INTEGER       NOT NULL,           -- en pesos colombianos (COP)
  foto        TEXT,                             -- URL imagen del plato
  disponible  BOOLEAN       DEFAULT TRUE,
  creado_en   TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platos_negocio ON platos(negocio_id);


-- ── 5. PLATO_DESCUENTOS ───────────────────────────────────────
--  - Precios especiales según el día de la semana
--  - dia: 'lunes' | 'martes' | ... | 'domingo'
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plato_descuentos (
  id                SERIAL PRIMARY KEY,
  plato_id          INTEGER   NOT NULL REFERENCES platos(id) ON DELETE CASCADE,
  dia               VARCHAR(12) NOT NULL
                    CHECK (dia IN ('lunes','martes','miercoles','jueves','viernes','sabado','domingo')),
  precio_descuento  INTEGER   NOT NULL,
  UNIQUE (plato_id, dia)
);


-- ── 6. RESEÑAS ────────────────────────────────────────────────
--  - usuario_nombre se cachea por si el usuario es eliminado
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resenas (
  id              SERIAL PRIMARY KEY,
  negocio_id      INTEGER     NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  usuario_id      INTEGER     REFERENCES usuarios(id) ON DELETE SET NULL,
  usuario_nombre  VARCHAR(100),
  estrellas       SMALLINT    NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
  comentario      TEXT        DEFAULT '',
  creado_en       TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resenas_negocio ON resenas(negocio_id);


-- ── 7. FAVORITOS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favoritos (
  usuario_id   INTEGER   NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  negocio_id   INTEGER   NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  guardado_en  TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (usuario_id, negocio_id)
);

CREATE INDEX IF NOT EXISTS idx_favoritos_usuario  ON favoritos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_negocio  ON favoritos(negocio_id);


-- ── 8. VISITAS ────────────────────────────────────────────────
--  - Se registra una fila cada vez que alguien abre el detalle
--    de un negocio (INSERT sin bloquear la respuesta HTTP)
--  - El panel agrupa por día para generar el gráfico de 30 días
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visitas (
  id          SERIAL PRIMARY KEY,
  negocio_id  INTEGER   NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  visitado_en TIMESTAMP DEFAULT NOW()
);

-- Índice compuesto: las queries filtran por negocio_id + fecha
CREATE INDEX IF NOT EXISTS idx_visitas_negocio_fecha
  ON visitas(negocio_id, visitado_en DESC);


-- ============================================================
--  DATOS INICIALES
-- ============================================================

-- ── Negocios de ejemplo (Valledupar) ──────────────────────────
-- ON CONFLICT DO NOTHING garantiza que correr el schema varias
-- veces nunca genere duplicados.
INSERT INTO negocios (
  nombre, categoria, descripcion, portada, calificacion, total_resenas,
  etiquetas, maps_url, activo
) VALUES
  (
    'La Parrilla de Don Lucho', 'Carnes y asados',
    'Asados a las brasas con leña de mangle, marinados 24 horas. La costilla es nuestra firma desde 1987.',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    4.8, 124,
    ARRAY['carne asada','costilla','churrasco','parrilla'],
    NULL, TRUE
  ),
  (
    'El Desgranado Sabroso', 'Comida típica',
    'El desgranado más auténtico del Cesar. Maíz tierno desgranado, con hogao casero, suero costeño y chicharrón crujiente.',
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80',
    4.6, 89,
    ARRAY['desgranado','maíz','comida típica','costeño'],
    NULL, TRUE
  ),
  (
    'Fritos Donde la Negra', 'Fritanga',
    'Empanadas de pipián, carimañolas de queso, buñuelos de yuca y arepas de chócolo fritas. Todo hecho a mano desde las 5am.',
    'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&q=80',
    4.9, 211,
    ARRAY['empanadas','carimañola','fritanga','buñuelos'],
    NULL, TRUE
  ),
  (
    'Jugos Naturales El Frescor', 'Jugos y bebidas',
    'Más de 30 frutas frescas de la región. Nuestro corozo con limón y el mango biche con sal son los favoritos del barrio.',
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80',
    4.7, 67,
    ARRAY['jugos','corozo','mango biche','frutas naturales'],
    NULL, TRUE
  ),
  (
    'Arepa''e Huevo Don Beto', 'Comida callejera',
    'La arepa e'' huevo frita más crocante del sur de Valledupar. Masa gruesa, huevo entero adentro, con hogao y ají casero al lado.',
    'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600&q=80',
    4.5, 158,
    ARRAY['arepa e huevo','frita','desayuno','callejero'],
    NULL, TRUE
  ),
  (
    'Cevichería La Bahía', 'Mariscos',
    'Ceviches frescos preparados al momento. Camarón, sierra, pulpo y mixto. El leche de tigre se sirve aparte para los valientes.',
    'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=600&q=80',
    4.4, 44,
    ARRAY['ceviche','camarón','mariscos','leche de tigre'],
    NULL, TRUE
  );
ON CONFLICT ON CONSTRAINT uq_negocios_nombre_categoria DO NOTHING;


-- ── Sedes ─────────────────────────────────────────────────────
-- Usamos subquery por nombre para que las sedes tampoco se dupliquen
-- aunque el schema se corra más de una vez.
INSERT INTO sedes (negocio_id, nombre, direccion, telefono, lat, lng, horario)
SELECT n.id, s.nombre, s.direccion, s.telefono, s.lat, s.lng, s.horario::jsonb
FROM (VALUES
  ('La Parrilla de Don Lucho', 'Sede Centro',
   'Calle 15 #8-42, Centro', '3001234567', 10.4631, -73.2532,
   '{"lunes":"11:00-22:00","martes":"11:00-22:00","miercoles":"11:00-22:00","jueves":"11:00-22:00","viernes":"11:00-23:00","sabado":"11:00-23:00","domingo":"11:00-21:00"}'
  ),
  ('La Parrilla de Don Lucho', 'Sede Norte',
   'Carrera 19 #34-10, Barrio Los Almendros', '3009876543', 10.4712, -73.2498,
   '{"lunes":"12:00-21:00","martes":"12:00-21:00","miercoles":"12:00-21:00","jueves":"12:00-21:00","viernes":"12:00-22:00","sabado":"12:00-22:00","domingo":"cerrado"}'
  ),
  ('El Desgranado Sabroso', 'Puesto Central',
   'Mercado Central, puesto 14', '3115556789', 10.4648, -73.2551,
   '{"lunes":"06:00-13:00","martes":"06:00-13:00","miercoles":"06:00-13:00","jueves":"06:00-13:00","viernes":"06:00-14:00","sabado":"06:00-14:00","domingo":"07:00-12:00"}'
  ),
  ('Fritos Donde la Negra', 'Frente al parque',
   'Frente al Parque Simón Bolívar, esquina', '3207778899', 10.4625, -73.2540,
   '{"lunes":"05:00-10:00","martes":"05:00-10:00","miercoles":"05:00-10:00","jueves":"05:00-10:00","viernes":"05:00-11:00","sabado":"05:00-12:00","domingo":"cerrado"}'
  ),
  ('Jugos Naturales El Frescor', 'Kiosko Principal',
   'Avenida Simón Bolívar con Calle 8, kiosko 3', '3124445566', 10.4638, -73.2520,
   '{"lunes":"07:00-19:00","martes":"07:00-19:00","miercoles":"07:00-19:00","jueves":"07:00-19:00","viernes":"07:00-20:00","sabado":"07:00-20:00","domingo":"08:00-17:00"}'
  ),
  ('Arepa''e Huevo Don Beto', 'Esquina de siempre',
   'Calle 22 con Carrera 12, barrio La Ceiba', '3016667788', 10.4655, -73.2575,
   '{"lunes":"06:00-11:00","martes":"06:00-11:00","miercoles":"06:00-11:00","jueves":"06:00-11:00","viernes":"06:00-11:30","sabado":"06:00-13:00","domingo":"07:00-12:00"}'
  ),
  ('Cevichería La Bahía', 'Local único',
   'Carrera 7 #16-30, Barrio El Centro', '3189998877', 10.4619, -73.2560,
   '{"lunes":"cerrado","martes":"11:00-20:00","miercoles":"11:00-20:00","jueves":"11:00-20:00","viernes":"11:00-21:00","sabado":"10:00-21:00","domingo":"10:00-18:00"}'
  )
) AS s(negocio_nombre, nombre, direccion, telefono, lat, lng, horario)
JOIN negocios n ON n.nombre = s.negocio_nombre
WHERE NOT EXISTS (
  SELECT 1 FROM sedes WHERE negocio_id = n.id AND nombre = s.nombre
);


-- ── Platos de ejemplo ─────────────────────────────────────────
INSERT INTO platos (negocio_id, nombre, descripcion, tipo, precio, disponible)
SELECT n.id, p.nombre, p.descripcion, p.tipo, p.precio, TRUE
FROM (VALUES
  ('La Parrilla de Don Lucho',   'Costilla a las brasas',            'Costilla de res marinada 24 h, ahumada con leña de mangle.',      'estrella',  28000),
  ('La Parrilla de Don Lucho',   'Pinchos mixtos',                   'Pinchos de res y cerdo con chimichurri de la casa.',               'economico', 12000),
  ('La Parrilla de Don Lucho',   'Churrasco completo',               'Churrasco de 400 g con papa, yuca, ensalada y arepa.',             'premium',   45000),
  ('La Parrilla de Don Lucho',   'Bandeja parrillera',               'Surtido de carne, chorizo, morcilla, chicharrón y acompañantes.',  'menu',      35000),
  ('El Desgranado Sabroso',      'Desgranado completo',              'Con hogao, suero costeño, chicharrón y aguacate.',                 'estrella',   9000),
  ('El Desgranado Sabroso',      'Desgranado sencillo',              'Maíz tierno con hogao y sal.',                                    'economico',  6000),
  ('El Desgranado Sabroso',      'Desgranado especial con langostino','La versión premium con langostino salteado al ajillo.',           'premium',   18000),
  ('Fritos Donde la Negra',      'Carimañola de queso',              'Masa de yuca rellena de queso costeño, frita al momento.',         'estrella',   2500),
  ('Fritos Donde la Negra',      'Empanada de pipián',               'Masa de maíz con guiso de papas y maní.',                         'economico',  1500),
  ('Fritos Donde la Negra',      'Bandeja mixta x6',                 '2 carimañolas, 2 empanadas, 2 buñuelos de yuca.',                  'premium',   14000),
  ('Jugos Naturales El Frescor', 'Corozo con limón',                 'Jugo natural de corozo costeño con toque de limón.',               'estrella',   4000),
  ('Jugos Naturales El Frescor', 'Limonada natural',                 'Limonada con menta fresca y panela.',                             'economico',  2500),
  ('Jugos Naturales El Frescor', 'Sorbete de guanábana',             'Cremoso y espeso, preparado con guanábana de temporada.',          'premium',    7000),
  ('Arepa''e Huevo Don Beto',    'Arepa e'' huevo con hogao',        'Nuestra clásica con hogao casero encima.',                        'estrella',   5000),
  ('Arepa''e Huevo Don Beto',    'Arepa e'' huevo sola',             'La original, sin acompañantes.',                                  'economico',  3500),
  ('Arepa''e Huevo Don Beto',    'Arepa e'' huevo con carne mechada','Rellena de carne mechada y queso fundido.',                       'premium',    9000),
  ('Cevichería La Bahía',        'Ceviche mixto',                    'Camarón, sierra y pulpo en leche de tigre con aguacate.',          'estrella',  22000),
  ('Cevichería La Bahía',        'Ceviche de sierra',                'Sierra fresca marinada en limón, cebolla y cilantro.',             'economico', 14000),
  ('Cevichería La Bahía',        'Ceviche de pulpo',                 'Pulpo tierno con leche de tigre, ají y maíz tostado.',             'premium',   32000)
) AS p(negocio_nombre, nombre, descripcion, tipo, precio)
JOIN negocios n ON n.nombre = p.negocio_nombre
WHERE NOT EXISTS (
  SELECT 1 FROM platos WHERE negocio_id = n.id AND nombre = p.nombre
);


-- ── Reseñas iniciales ─────────────────────────────────────────
INSERT INTO resenas (negocio_id, usuario_nombre, estrellas, comentario, creado_en)
SELECT n.id, r.usuario_nombre, r.estrellas, r.comentario, r.creado_en::timestamp
FROM (VALUES
  ('La Parrilla de Don Lucho',   'Carlos M.',  5, 'La mejor costilla de Valledupar, punto. El ahumado es perfecto.',             '2026-05-20'),
  ('La Parrilla de Don Lucho',   'Paola R.',   4, 'Muy buena la carne, el servicio podría ser más rápido los fines de semana.',  '2026-05-15'),
  ('El Desgranado Sabroso',      'Yesenia T.', 5, 'Me recuerda al que hacía mi abuela. El suero es casero de verdad.',           '2026-06-01'),
  ('El Desgranado Sabroso',      'Rodrigo P.', 4, 'Buenísimo el desgranado, a veces se acaban muy temprano.',                    '2026-05-28'),
  ('Fritos Donde la Negra',      'Marta C.',   5, 'Las carimañolas más ricas que he comido en mi vida, sin exagerar.',            '2026-06-05'),
  ('Jugos Naturales El Frescor', 'Luis A.',    5, 'El corozo con leche condensada es una experiencia espiritual.',                '2026-06-03'),
  ('Jugos Naturales El Frescor', 'Sandra V.',  4, 'Frescos y naturales de verdad, se nota que no usan concentrado.',              '2026-05-30'),
  ('Arepa''e Huevo Don Beto',    'Jorge H.',   5, 'La masa es perfecta, bien gruesa y el huevo queda entero. Arte puro.',         '2026-06-07'),
  ('Arepa''e Huevo Don Beto',    'Adriana M.', 4, 'Las mejores arepas e'' huevo que he probado fuera de Cartagena.',              '2026-05-25'),
  ('Cevichería La Bahía',        'Camila O.',  5, 'El ceviche mixto está brutal. El leche de tigre es adictivo.',                 '2026-06-02')
) AS r(negocio_nombre, usuario_nombre, estrellas, comentario, creado_en)
JOIN negocios n ON n.nombre = r.negocio_nombre
WHERE NOT EXISTS (
  SELECT 1 FROM resenas
  WHERE negocio_id = n.id
    AND usuario_nombre = r.usuario_nombre
    AND estrellas      = r.estrellas::smallint
);