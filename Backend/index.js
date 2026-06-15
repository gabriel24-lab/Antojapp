require("dotenv").config();

// ── Validación de variables de entorno críticas ────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET no definido o demasiado corto (mínimo 32 caracteres). Abortando.");
  process.exit(1);
}
if (!process.env.FRONTEND_URL) {
  console.error("FRONTEND_URL no definido. Abortando.");
  process.exit(1);
}

const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit    = require("express-rate-limit");

const authRoutes      = require("./routes/auth");
const negociosRoutes  = require("./routes/negocios");
const favoritosRoutes = require("./routes/favoritos");
const panelRoutes     = require("./routes/panel");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Trust proxy ──────────────────────────────────────────────
// "1" = confiar en exactamente 1 proxy delante de la app (el load
// balancer de Render/Railway/etc.). Express usará el último valor de
// X-Forwarded-For añadido por ESE proxy como IP real del cliente,
// ignorando cualquier valor que el cliente intente inyectar en el header.
//
// ⚠️ Si cambias de proveedor o agregas un CDN/proxy adicional delante
// (ej. Cloudflare + Render = 2 hops), este valor DEBE actualizarse al
// número exacto de saltos, o el rate limiting por IP podría aplicarse
// a la IP del proxy en vez de la del cliente (bypass) o rechazar
// erróneamente a usuarios legítimos detrás de NAT.
app.set("trust proxy", 1);

// ── Seguridad: headers HTTP con CSP explícita ──────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'"], // inline styles del frontend Vite
      imgSrc:      [
        "'self'",
        "data:",
        "blob:",
        // Supabase storage donde se suben las imágenes de negocios/usuarios
        process.env.SUPABASE_URL || "",
        // Fotos de perfil de Google (campo "picture" del id_token)
        "https://lh3.googleusercontent.com",
      ].filter(Boolean),
      connectSrc:  ["'self'", process.env.FRONTEND_URL],
      fontSrc:     ["'self'", "https://fonts.gstatic.com"],
      objectSrc:   ["'none'"],
      frameSrc:    ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
    },
  },
  // HSTS solo en producción
  strictTransportSecurity: process.env.NODE_ENV === "production"
    ? { maxAge: 31536000, includeSubDomains: true }
    : false,
}));

// ── CORS ───────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL,
  credentials: true, // necesario para que el browser envíe cookies
}));

// ── Parsers ────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser()); // necesario para leer req.cookies.token

// ── Rate limiting global ───────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: "Demasiadas solicitudes, intenta más tarde." },
});
app.use(globalLimiter);

// ── Rate limiting estricto para auth (por IP) ──────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: "Demasiados intentos de autenticación, intenta en 15 minutos." },
});

// ── Rutas ─────────────────────────────────────────────────────
app.use("/api/auth",      authLimiter, authRoutes);
app.use("/api/negocios",  negociosRoutes);
app.use("/api/favoritos", favoritosRoutes);
app.use("/api/panel",     panelRoutes);

// ── Health check ──────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ estado: "ok", timestamp: new Date().toISOString() });
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.path} no encontrada` });
});

// ── Error handler global ──────────────────────────────────────
app.use((err, req, res, next) => {
  const esProduccion = process.env.NODE_ENV === "production";
  console.error("[ERROR]", err.message);
  res.status(err.status || 500).json({
    error: esProduccion ? "Error interno del servidor" : err.message,
  });
});

// ── Arrancar servidor ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});