-- ============================================================
--  ANTOJAPP — Script de base de datos
--  Ejecutar en PostgreSQL: psql -d antojapp -f schema.sql
-- ============================================================

-- Extensión para UUID (opcional, usamos SERIAL por simplicidad)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Usuarios ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id           SERIAL PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  email        VARCHAR(150) NOT NULL UNIQUE,
  password     VARCHAR(255),             -- NULL si es login con Google
  es_google    BOOLEAN DEFAULT FALSE,
  creado_en    TIMESTAMP DEFAULT NOW()
);

-- ── Negocios ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS negocios (
  id                  SERIAL PRIMARY KEY,
  nombre              VARCHAR(150) NOT NULL,
  categoria           VARCHAR(100) NOT NULL,
  descripcion         TEXT,
  portada             TEXT,
  calificacion        NUMERIC(2,1) DEFAULT 0,
  total_resenas       INTEGER DEFAULT 0,
  etiquetas           TEXT[],               -- array de strings
  plato_estrella_nombre  VARCHAR(150),
  plato_estrella_precio  INTEGER,
  plato_economico_nombre VARCHAR(150),
  plato_economico_precio INTEGER,
  plato_premium_nombre   VARCHAR(150),
  plato_premium_precio   INTEGER,
  creado_en           TIMESTAMP DEFAULT NOW()
);

-- ── Sedes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sedes (
  id           SERIAL PRIMARY KEY,
  negocio_id   INTEGER NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  nombre       VARCHAR(150) NOT NULL,
  direccion    VARCHAR(255),
  telefono     VARCHAR(20),
  lat          NUMERIC(9,6),
  lng          NUMERIC(9,6),
  horario      JSONB         -- { lunes: "11:00-22:00", ... }
);

-- ── Reseñas ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resenas (
  id           SERIAL PRIMARY KEY,
  negocio_id   INTEGER NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  usuario_id   INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  usuario_nombre VARCHAR(100),             -- cache por si se borra el usuario
  estrellas    SMALLINT NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
  comentario   TEXT,
  creado_en    TIMESTAMP DEFAULT NOW()
);

-- ── Favoritos ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favoritos (
  usuario_id   INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  negocio_id   INTEGER NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  guardado_en  TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (usuario_id, negocio_id)
);

-- ============================================================
--  DATOS INICIALES (los 6 negocios del mock)
-- ============================================================

INSERT INTO negocios (nombre, categoria, descripcion, portada, calificacion, total_resenas, etiquetas,
  plato_estrella_nombre, plato_estrella_precio,
  plato_economico_nombre, plato_economico_precio,
  plato_premium_nombre, plato_premium_precio)
VALUES
  ('La Parrilla de Don Lucho', 'Carnes y asados',
   'Asados a las brasas con leña de mangle, marinados 24 horas. La costilla es nuestra firma desde 1987.',
   'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
   4.8, 124, ARRAY['carne asada','costilla','churrasco','parrilla'],
   'Costilla a las brasas', 28000, 'Pinchos mixtos', 12000, 'Churrasco completo', 45000),

  ('El Desgranado Sabroso', 'Comida típica',
   'El desgranado más auténtico del Cesar. Maíz tierno desgranado, con hogao casero, suero costeño y chicharrón crujiente.',
   'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80',
   4.6, 89, ARRAY['desgranado','maíz','comida típica','costeño'],
   'Desgranado completo', 9000, 'Desgranado sencillo', 6000, 'Desgranado especial con langostino', 18000),

  ('Fritos Donde la Negra', 'Fritanga',
   'Empanadas de pipián, carimañolas de queso, buñuelos de yuca y arepas de chócolo fritas. Todo hecho a mano desde las 5am.',
   'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&q=80',
   4.9, 211, ARRAY['empanadas','carimañola','fritanga','buñuelos'],
   'Carimañola de queso', 2500, 'Empanada de pipián', 1500, 'Bandeja mixta x6', 14000),

  ('Jugos Naturales El Frescor', 'Jugos y bebidas',
   'Más de 30 frutas frescas de la región. Nuestro corozo con limón y el mango biche con sal son los favoritos del barrio.',
   'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80',
   4.7, 67, ARRAY['jugos','corozo','mango biche','frutas naturales'],
   'Corozo con limón', 4000, 'Limonada natural', 2500, 'Sorbete de guanábana', 7000),

  ('Arepa''e Huevo Don Beto', 'Comida callejera',
   'La arepa e'' huevo frita más crocante del sur de Valledupar. Masa gruesa, huevo entero adentro, con hogao y ají casero al lado.',
   'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600&q=80',
   4.5, 158, ARRAY['arepa e huevo','frita','desayuno','callejero'],
   'Arepa e'' huevo con hogao', 5000, 'Arepa e'' huevo sola', 3500, 'Arepa e'' huevo con carne mechada', 9000),

  ('Cevichería La Bahía', 'Mariscos',
   'Ceviches frescos preparados al momento. Camarón, sierra, pulpo y mixto. El leche de tigre se sirve aparte para los valientes.',
   'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=600&q=80',
   4.4, 44, ARRAY['ceviche','camarón','mariscos','leche de tigre'],
   'Ceviche mixto', 22000, 'Ceviche de sierra', 14000, 'Ceviche de pulpo', 32000);

-- Sedes
INSERT INTO sedes (negocio_id, nombre, direccion, telefono, lat, lng, horario) VALUES
  (1, 'Sede Centro',    'Calle 15 #8-42, Centro',                    '3001234567', 10.4631, -73.2532,
   '{"lunes":"11:00-22:00","martes":"11:00-22:00","miercoles":"11:00-22:00","jueves":"11:00-22:00","viernes":"11:00-23:00","sabado":"11:00-23:00","domingo":"11:00-21:00"}'),
  (1, 'Sede Norte',     'Carrera 19 #34-10, Barrio Los Almendros',    '3009876543', 10.4712, -73.2498,
   '{"lunes":"12:00-21:00","martes":"12:00-21:00","miercoles":"12:00-21:00","jueves":"12:00-21:00","viernes":"12:00-22:00","sabado":"12:00-22:00","domingo":"cerrado"}'),
  (2, 'Puesto Central', 'Mercado Central, puesto 14',                 '3115556789', 10.4648, -73.2551,
   '{"lunes":"06:00-13:00","martes":"06:00-13:00","miercoles":"06:00-13:00","jueves":"06:00-13:00","viernes":"06:00-14:00","sabado":"06:00-14:00","domingo":"07:00-12:00"}'),
  (3, 'Frente al parque','Frente al Parque Simón Bolívar, esquina',   '3207778899', 10.4625, -73.2540,
   '{"lunes":"05:00-10:00","martes":"05:00-10:00","miercoles":"05:00-10:00","jueves":"05:00-10:00","viernes":"05:00-11:00","sabado":"05:00-12:00","domingo":"cerrado"}'),
  (4, 'Kiosko Principal','Avenida Simón Bolívar con Calle 8, kiosko 3','3124445566', 10.4638, -73.2520,
   '{"lunes":"07:00-19:00","martes":"07:00-19:00","miercoles":"07:00-19:00","jueves":"07:00-19:00","viernes":"07:00-20:00","sabado":"07:00-20:00","domingo":"08:00-17:00"}'),
  (5, 'Esquina de siempre','Calle 22 con Carrera 12, barrio La Ceiba','3016667788', 10.4655, -73.2575,
   '{"lunes":"06:00-11:00","martes":"06:00-11:00","miercoles":"06:00-11:00","jueves":"06:00-11:00","viernes":"06:00-11:30","sabado":"06:00-13:00","domingo":"07:00-12:00"}'),
  (6, 'Local único',    'Carrera 7 #16-30, Barrio El Centro',         '3189998877', 10.4619, -73.2560,
   '{"lunes":"cerrado","martes":"11:00-20:00","miercoles":"11:00-20:00","jueves":"11:00-20:00","viernes":"11:00-21:00","sabado":"10:00-21:00","domingo":"10:00-18:00"}');

-- Reseñas iniciales
INSERT INTO resenas (negocio_id, usuario_nombre, estrellas, comentario, creado_en) VALUES
  (1, 'Carlos M.',  5, 'La mejor costilla de Valledupar, punto. El ahumado es perfecto.',              '2026-05-20'),
  (1, 'Paola R.',   4, 'Muy buena la carne, el servicio podría ser más rápido los fines de semana.',   '2026-05-15'),
  (2, 'Yesenia T.', 5, 'Me recuerda al que hacía mi abuela. El suero es casero de verdad.',            '2026-06-01'),
  (2, 'Rodrigo P.', 4, 'Buenísimo el desgranado, a veces se acaban muy temprano.',                     '2026-05-28'),
  (3, 'Marta C.',   5, 'Las carimañolas más ricas que he comido en mi vida, sin exagerar.',             '2026-06-05'),
  (4, 'Luis A.',    5, 'El corozo con leche condensada es una experiencia espiritual.',                 '2026-06-03'),
  (4, 'Sandra V.',  4, 'Frescos y naturales de verdad, se nota que no usan concentrado.',               '2026-05-30'),
  (5, 'Jorge H.',   5, 'La masa es perfecta, bien gruesa y el huevo queda entero. Arte puro.',          '2026-06-07'),
  (5, 'Adriana M.', 4, 'Las mejores arepas e'' huevo que he probado fuera de Cartagena.',               '2026-05-25'),
  (6, 'Camila O.',  5, 'El ceviche mixto está brutal. El leche de tigre es adictivo.',                  '2026-06-02');
