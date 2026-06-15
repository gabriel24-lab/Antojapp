const { OAuth2Client } = require("google-auth-library");
const jwt              = require("jsonwebtoken");
const pool             = require("../db/pool");

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
// Body: { credential, rol? }
//   - Si el usuario ya existe → inicia sesión normalmente (rol ignorado)
//   - Si es nuevo y viene `rol` → crea la cuenta con ese rol
//   - Si es nuevo y NO viene `rol` → responde { esNuevo: true } sin crear cuenta
//     para que el frontend muestre el selector de rol
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
    const result = await pool.query(
      "SELECT id, nombre, email, rol, token_version, foto_perfil FROM usuarios WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length > 0) {
      // Usuario existente → login normal
      const usuario = result.rows[0];

      // Solo usar la foto de Google si el usuario no ha subido la suya propia
      // (no sobrescribir una foto personalizada con la de Google en cada login).
      const fotoPerfil = usuario.foto_perfil || picture || null;

      await pool.query(
        "UPDATE usuarios SET es_google = TRUE, foto_perfil = COALESCE(foto_perfil, $2) WHERE id = $1",
        [usuario.id, picture || null]
      );

      const token = generarToken(usuario);
      res.cookie("token", token, COOKIE_OPTS);
      return res.json({
        esNuevo: false,
        usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, foto_perfil: fotoPerfil },
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
    const insert = await pool.query(
      `INSERT INTO usuarios (nombre, email, es_google, rol, foto_perfil)
       VALUES ($1, $2, TRUE, $3, $4)
       RETURNING id, nombre, email, rol, token_version, foto_perfil`,
      [nombre || email.split("@")[0], email.toLowerCase(), rol, picture || null]
    );
    const usuario = insert.rows[0];

    const token = generarToken(usuario);
    res.cookie("token", token, COOKIE_OPTS);
    return res.json({
      esNuevo: true,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, foto_perfil: usuario.foto_perfil },
    });

  } catch (err) {
    console.error("[googleLogin]", err.message);

    if (err.message?.includes("Token used too late") || err.message?.includes("Invalid token"))
      return res.status(401).json({ error: "Token de Google inválido o expirado" });

    res.status(500).json({ error: "Error al autenticar con Google" });
  }
}

module.exports = { googleLogin };