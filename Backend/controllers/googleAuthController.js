const { OAuth2Client } = require("google-auth-library");
const jwt              = require("jsonwebtoken");
const pool             = require("../db/pool");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge:   7 * 24 * 60 * 60 * 1000,
  path:     "/",
};

function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// POST /api/auth/google
async function googleLogin(req, res) {
  const { credential } = req.body;

  if (!credential)
    return res.status(400).json({ error: "Token de Google no proporcionado" });

  if (typeof credential !== "string" || credential.length > 4096)
    return res.status(400).json({ error: "Token de Google inválido" });

  try {
    const ticket = await client.verifyIdToken({
      idToken:  credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name: nombre, email_verified } = payload;

    if (!email)
      return res.status(400).json({ error: "No se pudo obtener el correo de Google" });

    if (!email_verified)
      return res.status(400).json({ error: "El correo de Google no está verificado" });

    let result = await pool.query(
      "SELECT id, nombre, email, rol FROM usuarios WHERE email = $1",
      [email.toLowerCase()]
    );

    let usuario;

    if (result.rows.length > 0) {
      usuario = result.rows[0];
      await pool.query("UPDATE usuarios SET es_google = TRUE WHERE id = $1", [usuario.id]);
    } else {
      const insert = await pool.query(
        `INSERT INTO usuarios (nombre, email, es_google, rol)
         VALUES ($1, $2, TRUE, 'usuario')
         RETURNING id, nombre, email, rol`,
        [nombre || email.split("@")[0], email.toLowerCase()]
      );
      usuario = insert.rows[0];
    }

    const token = generarToken(usuario);

    // Emitir JWT en cookie HttpOnly
    res.cookie("token", token, COOKIE_OPTS);

    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    });

  } catch (err) {
    console.error("[googleLogin]", err.message);

    if (err.message?.includes("Token used too late") || err.message?.includes("Invalid token"))
      return res.status(401).json({ error: "Token de Google inválido o expirado" });

    res.status(500).json({ error: "Error al autenticar con Google" });
  }
}

module.exports = { googleLogin };
