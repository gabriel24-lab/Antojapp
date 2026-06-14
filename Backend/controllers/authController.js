const argon2 = require("argon2");
const jwt    = require("jsonwebtoken");
const pool   = require("../db/pool");

// Configuración de la cookie HttpOnly
const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production", // solo HTTPS en prod
  // "none" es obligatorio para cookies cross-site (frontend en pages.dev, backend en onrender.com).
  // Requiere secure: true (HTTPS), por eso solo se usa "none" en producción.
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 días en ms
  path:     "/",
};

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

  // Validar longitudes para prevenir ataques de campos enormes
  if (nombre.length > 100)
    return res.status(400).json({ error: "El nombre no puede superar 100 caracteres" });
  if (email.length > 254)
    return res.status(400).json({ error: "Email inválido" });
  if (password.length > 128)
    return res.status(400).json({ error: "La contraseña no puede superar 128 caracteres" });

  const errorPassword = validarPassword(password);
  if (errorPassword)
    return res.status(400).json({ error: errorPassword });

  // Normalizar: "propietario" se guarda como "negocio" para consistencia
  const rolNormalizado = (rol === "negocio" || rol === "propietario") ? "negocio" : "usuario";

  try {
    const existe = await pool.query("SELECT id FROM usuarios WHERE email = $1", [email.toLowerCase()]);
    if (existe.rows.length > 0)
      return res.status(409).json({ error: "Este correo ya está registrado" });

    const hash = await argon2.hash(password);

    const result = await pool.query(
      "INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol",
      [nombre.trim(), email.toLowerCase(), hash, rolNormalizado]
    );

    const usuario = result.rows[0];
    const token   = generarToken(usuario);

    // Emitir JWT en cookie HttpOnly — no exponer en body para producción
    res.cookie("token", token, COOKIE_OPTS);

    // Mantener el token en body también para compatibilidad con clientes API
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

  if (email.length > 254 || password.length > 128)
    return res.status(400).json({ error: "Credenciales inválidas" });

  try {
    const result = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email.toLowerCase()]
    );

    // Respuesta genérica para no revelar si el email existe
    if (result.rows.length === 0) {
      await argon2.hash("dummy_para_tiempo_constante"); // evitar timing attack
      return res.status(401).json({ error: "Correo o contraseña incorrectos" });
    }

    const usuario = result.rows[0];

    if (usuario.es_google)
      return res.status(400).json({ error: "Esta cuenta usa Google para iniciar sesión" });

    const coincide = await argon2.verify(usuario.password, password);
    if (!coincide)
      return res.status(401).json({ error: "Correo o contraseña incorrectos" });

    // Normalizar rol legacy
    const rolNormalizado = usuario.rol === "propietario" ? "negocio" : usuario.rol;
    const usuarioNormalizado = { ...usuario, rol: rolNormalizado };

    const token = generarToken(usuarioNormalizado);

    // Emitir JWT en cookie HttpOnly
    res.cookie("token", token, COOKIE_OPTS);

    res.json({
      token,
      usuario: {
        id:     usuarioNormalizado.id,
        nombre: usuarioNormalizado.nombre,
        email:  usuarioNormalizado.email,
        rol:    usuarioNormalizado.rol,
      }
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

    const usuario = result.rows[0];
    const rolNormalizado = usuario.rol === "propietario" ? "negocio" : usuario.rol;

    res.json({ ...usuario, rol: rolNormalizado });
  } catch (err) {
    console.error("[me]", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// POST /api/auth/logout — limpia la cookie
async function logout(req, res) {
  res.clearCookie("token", { ...COOKIE_OPTS, maxAge: 0 });
  res.json({ mensaje: "Sesión cerrada" });
}

module.exports = { registro, login, me, logout };
