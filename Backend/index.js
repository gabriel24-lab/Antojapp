require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const authRoutes      = require("./routes/auth");
const negociosRoutes  = require("./routes/negocios");
const favoritosRoutes = require("./routes/favoritos");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globales ───────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());

// ── Rutas ─────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/negocios",  negociosRoutes);
app.use("/api/favoritos", favoritosRoutes);

// ── Health check ──────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ estado: "ok", timestamp: new Date().toISOString() });
});

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.path} no encontrada` });
});

// ── Arrancar servidor ─────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
