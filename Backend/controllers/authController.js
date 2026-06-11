const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const pool   = require("../db/pool");

function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// ── Validaciones reutilizables ─────────────────────────────────
function validarPassword(password) {
  if (!password || password.length < 8)
    return "La contraseña debe tener al menos 8 caracteres";
  if (!/[A-Z]/.test(password))
    return "La contraseña debe contener al menos una letra mayúscula";
  if (!/[0-9]/.test(password))
    return "La contraseña debe contener al menos un número";
  return null;
}

// POST /api/auth/registro
async function registro(req, res) {
  const { nombre, email, password, rol } = req.body;

  if (!nombre || !email || !password)
    return res.status(400).json({ error: "Todos los campos son obligatorios" });

  const errorPassword = validarPassword(password);
  if (errorPassword)
    return res.status(400).json({ error: errorPassword });

  const rolValido = ["usuario", "negocio"].includes(rol) ? rol : "usuario";

  try {
    const existe = await pool.query("SELECT id FROM usuarios WHERE email = $1", [email.toLowerCase()]);
    if (existe.rows.length > 0)
      return res.status(409).json({ error: "Este correo ya está registrado" });

    const hash = await bcrypt.hash(password, 12); // salt 12 (más seguro que 10)

    const result = await pool.query(
      "INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol",
      [nombre.trim(), email.toLowerCase(), hash, rolValido]
    );

    const usuario = result.rows[0];
    const token   = generarToken(usuario);

    res.status(201).json({ token, usuario });
  } catch (err) {
    console.error("[registro]", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Correo y contraseña son obligatorios" });

  try {
    const result = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email.toLowerCase()]
    );

    // Respuesta genérica para no revelar si el email existe
    if (result.rows.length === 0) {
      await bcrypt.hash("dummy_para_tiempo_constante", 12); // evitar timing attack
      return res.status(401).json({ error: "Correo o contraseña incorrectos" });
    }

    const usuario = result.rows[0];

    if (usuario.es_google)
      return res.status(400).json({ error: "Esta cuenta usa Google para iniciar sesión" });

    const coincide = await bcrypt.compare(password, usuario.password);
    if (!coincide)
      return res.status(401).json({ error: "Correo o contraseña incorrectos" });

    const token = generarToken(usuario);

    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    });
  } catch (err) {
    console.error("[login]", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// GET /api/auth/me  (requiere token)
async function me(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, nombre, email, rol, creado_en FROM usuarios WHERE id = $1",
      [req.usuario.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("[me]", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = { registro, login, me };
