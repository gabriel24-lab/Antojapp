const rateLimit = require("express-rate-limit");

// ── Key por usuario autenticado ─────────────────────────────────
// Estas rutas requieren `auth` (req.usuario.id existe). Usamos el ID
// de usuario como key en vez de IP: evita que usuarios detrás de NAT/
// proxy compartan el límite, y evita bypass rotando IP — el atacante
// necesitaría rotar de CUENTA, no de IP.
function keyPorUsuario(req) {
  return req.usuario?.id ? `u:${req.usuario.id}` : req.ip;
}

// ── Rate limiting adicional para login (por email) ──────────────
// Defensa en profundidad ante bypass del authLimiter global (por IP)
// mediante rotación de IPs (proxies residenciales): este limiter usa el
// EMAIL del body como key, así que frena fuerza bruta dirigida a UNA
// cuenta aunque el atacante cambie de IP en cada intento.
// No sustituye al authLimiter de index.js — se aplica además, solo en
// /api/auth/login. express.json() ya corrió antes de llegar aquí, por
// lo que req.body está disponible.
const loginPorCuentaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 intentos por cuenta cada 15 min, independientemente de la IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.toLowerCase().trim()
        : "";
    return email ? `email:${email}` : req.ip;
  },
  message: {
    error: "Demasiados intentos para esta cuenta. Intenta en 15 minutos.",
  },
});

// ── Subida de imágenes (icono/portada de negocio, fotos, fotos de platos) ──
// Costoso en I/O y cuota de Supabase Storage (hasta 2MB por archivo).
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 subidas/hora por usuario
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyPorUsuario,
  message: {
    error: "Demasiadas subidas de imágenes. Intenta de nuevo en una hora.",
  },
});

// ── Reseñas ──────────────────────────────────────────────────────
// La constraint UNIQUE(negocio_id, usuario_id) ya limita una reseña por
// negocio, pero sin límite un atacante podría intentar crear reseñas en
// cientos de negocios distintos rápidamente (spam).
const resenaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 reseñas/hora por usuario
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyPorUsuario,
  message: {
    error: "Demasiadas reseñas creadas. Intenta de nuevo en una hora.",
  },
});

// ── Favoritos (agregar/quitar) ──────────────────────────────────
// Operación liviana en BD, pero sin límite permite "martillar" el
// endpoint (toggle masivo) como vector de DoS de baja intensidad.
const favoritoLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 60, // 60 cambios/5min por usuario
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyPorUsuario,
  message: { error: "Demasiados cambios en favoritos. Espera unos minutos." },
});

// ── Creación/edición de negocios, sedes y platos ────────────────
// Operaciones de escritura del propietario; menos frecuentes pero
// conviene acotarlas para evitar scripts automatizados de alta cadencia.
const escrituraNegocioLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 60, // 60 escrituras/15min por usuario
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyPorUsuario,
  message: { error: "Demasiadas solicitudes de escritura. Intenta más tarde." },
});

module.exports = {
  uploadLimiter,
  resenaLimiter,
  favoritoLimiter,
  escrituraNegocioLimiter,
  loginPorCuentaLimiter,
};
