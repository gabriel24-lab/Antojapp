const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
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
    req.usuario = payload; // { id, nombre, email, rol }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

module.exports = authMiddleware;
