const { OAuth2Client } = require("google-auth-library");
const jwt              = require("jsonwebtoken");
const prisma           = require("../db/pool");
const { captureError } = require("../lib/sentry");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge:   7 * 24 * 60 * 60 * 1000,
  path:     "/",
};

function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, tv: usuario.token_version },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// POST /api/auth/google
async function googleLogin(req, res) {
  const { credential, rol } = req.body;

  if (!credential)
    return res.status(400).json({ error: "Token de Google no proporcionado" });

  if (typeof credential !== "string" || credential.length > 4096)
    return res.status(400).json({ error: "Token de Google inválido" });

  // Validar el rol si viene
  if (rol && !["usuario", "negocio"].includes(rol))
    return res.status(400).json({ error: "Rol no válido" });

  try {
    const ticket = await client.verifyIdToken({
      idToken:  credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name: nombre, email_verified, picture } = payload;

    if (!email)
      return res.status(400).json({ error: "No se pudo obtener el correo de Google" });

    if (!email_verified)
      return res.status(400).json({ error: "El correo de Google no está verificado" });

    // ── ¿Ya existe el usuario? ──
    const usuarioExistente = await prisma.usuarios.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, nombre: true, email: true, rol: true, token_version: true, foto_perfil: true }
    });

    if (usuarioExistente) {
      // Usuario existente → login normal
      const fotoPerfil = usuarioExistente.foto_perfil || picture || null;

      const usuarioActualizado = await prisma.usuarios.update({
        where: { id: usuarioExistente.id },
        data: {
          es_google: true,
          foto_perfil: fotoPerfil
        },
        select: { id: true, nombre: true, email: true, rol: true, token_version: true, foto_perfil: true }
      });

      const token = generarToken(usuarioActualizado);
      res.cookie("token", token, COOKIE_OPTS);
      return res.json({
        esNuevo: false,
        usuario: { id: usuarioActualizado.id, nombre: usuarioActualizado.nombre, email: usuarioActualizado.email, rol: usuarioActualizado.rol, foto_perfil: usuarioActualizado.foto_perfil },
      });
    }

    // ── Usuario nuevo ──

    // Si no se envió rol todavía → pedirlo al frontend
    if (!rol) {
      return res.status(200).json({
        esNuevo:  true,
        pendiente: true,          // señal: falta elegir rol
        nombre:   nombre || email.split("@")[0],
        email:    email.toLowerCase(),
      });
    }

    // Ya viene rol → crear la cuenta
    const usuarioNuevo = await prisma.usuarios.create({
      data: {
        nombre: nombre || email.split("@")[0],
        email: email.toLowerCase(),
        es_google: true,
        rol: rol,
        foto_perfil: picture || null
      },
      select: { id: true, nombre: true, email: true, rol: true, token_version: true, foto_perfil: true }
    });

    const token = generarToken(usuarioNuevo);
    res.cookie("token", token, COOKIE_OPTS);
    return res.json({
      esNuevo: true,
      usuario: { id: usuarioNuevo.id, nombre: usuarioNuevo.nombre, email: usuarioNuevo.email, rol: usuarioNuevo.rol, foto_perfil: usuarioNuevo.foto_perfil },
    });

  } catch (err) {
    captureError(err, "[googleLogin]");

    if (err.message?.includes("Token used too late") || err.message?.includes("Invalid token"))
      return res.status(401).json({ error: "Token de Google inválido o expirado" });

    res.status(500).json({ error: "Estamos experimentando problemas con Google. Inténtalo más tarde." });
  }
}

module.exports = { googleLogin };