const jwt = require("jsonwebtoken");
const pool = require("../db/pool");

async function authMiddleware(req, res, next) {
  // 1. Intentar leer el token desde la cookie HttpOnly (flujo principal)
  let token = req.cookies?.token;

  // 2. Fallback a Authorization header (para clientes API / mobile que aún no usen cookies)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // ── Verificación de revocación (token_version) ──────────────
    // Si el token fue emitido antes de un logout global / cambio de
    // password / baneo, su "tv" no coincidirá con el valor actual en BD
    // y se rechaza aunque la firma y expiración sean válidas.
    const usuario = await pool.usuarios.findUnique({
      where: { id: payload.id },
      select: { token_version: true },
    });

    if (!usuario)
      return res.status(401).json({ error: "Token inválido o expirado" });

    if (usuario.token_version !== payload.tv)
      return res
        .status(401)
        .json({ error: "Sesión revocada, inicia sesión de nuevo" });

    req.usuario = payload; // { id, nombre, email, rol, tv }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

module.exports = authMiddleware;
