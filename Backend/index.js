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
        // Supabase storage donde se suben las imágenes de negocios
        process.env.SUPABASE_URL || "",
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

// ── Rate limiting estricto para auth ──────────────────────────
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
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
