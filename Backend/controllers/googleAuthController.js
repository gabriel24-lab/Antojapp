const { OAuth2Client } = require("google-auth-library");
const jwt              = require("jsonwebtoken");
const pool             = require("../db/pool");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// POST /api/auth/google
// El frontend envía el `credential` (id_token) que devuelve Google Identity Services (GIS).
// Este endpoint lo verifica con Google, busca o crea el usuario, y retorna nuestro JWT.
async function googleLogin(req, res) {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: "Token de Google no proporcionado" });
  }

  try {
    // 1. Verificar el id_token con Google
    const ticket = await client.verifyIdToken({
      idToken:  credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name: nombre, picture: avatar } = payload;

    if (!email) {
      return res.status(400).json({ error: "No se pudo obtener el correo de Google" });
    }

    // 2. Buscar usuario por email
    let result = await pool.query(
      "SELECT id, nombre, email FROM usuarios WHERE email = $1",
      [email.toLowerCase()]
    );

    let usuario;

    if (result.rows.length > 0) {
      // Usuario existente — actualizar es_google si aún no estaba marcado
      usuario = result.rows[0];
      await pool.query(
        "UPDATE usuarios SET es_google = TRUE WHERE id = $1",
        [usuario.id]
      );
    } else {
      // Usuario nuevo — crearlo sin password
      const insert = await pool.query(
        `INSERT INTO usuarios (nombre, email, es_google)
         VALUES ($1, $2, TRUE)
         RETURNING id, nombre, email`,
        [nombre || email.split("@")[0], email.toLowerCase()]
      );
      usuario = insert.rows[0];
    }

    // 3. Emitir nuestro JWT y responder
    const token = generarToken(usuario);

    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
    });

  } catch (err) {
    console.error("Error en googleLogin:", err.message);

    if (err.message?.includes("Token used too late") || err.message?.includes("Invalid token")) {
      return res.status(401).json({ error: "Token de Google inválido o expirado" });
    }

    res.status(500).json({ error: "Error al autenticar con Google" });
  }
}

module.exports = { googleLogin };
