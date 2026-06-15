const argon2   = require("argon2");
const jwt      = require("jsonwebtoken");
const pool     = require("../db/pool");
const supabase = require("../db/supabase");

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
    { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, tv: usuario.token_version },
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
      "INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol, token_version",
      [nombre.trim(), email.toLowerCase(), hash, rolNormalizado]
    );

    const usuario = result.rows[0];
    const token   = generarToken(usuario);

    // Emitir JWT en cookie HttpOnly — único canal del token.
    // SEGURIDAD: ya no se devuelve "token" en el body. Si en el JSON de
    // respuesta hubiera el JWT, cualquier XSS podría leerlo via fetch/XHR
    // sin necesidad de robar la cookie HttpOnly.
    res.cookie("token", token, COOKIE_OPTS);

    res.status(201).json({
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    });
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

    // Emitir JWT en cookie HttpOnly — único canal del token (ver nota en registro)
    res.cookie("token", token, COOKIE_OPTS);

    res.json({
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
      "SELECT id, nombre, email, rol, es_google, foto_perfil, creado_en FROM usuarios WHERE id = $1",
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

// POST /api/auth/logout — limpia la cookie Y revoca todos los tokens emitidos
// (incrementa token_version). Requiere estar autenticado.
async function logout(req, res) {
  try {
    await pool.query(
      "UPDATE usuarios SET token_version = token_version + 1 WHERE id = $1",
      [req.usuario.id]
    );
  } catch (err) {
    console.error("[logout]", err.message);
    // Continuar limpiando la cookie aunque falle el incremento en BD
  }

  res.clearCookie("token", { ...COOKIE_OPTS, maxAge: 0 });
  res.json({ mensaje: "Sesión cerrada" });
}

// PUT /api/auth/perfil — actualizar nombre (requiere auth)
async function actualizarPerfil(req, res) {
  const { nombre } = req.body;

  try {
    const result = await pool.query(
      `UPDATE usuarios SET nombre = $1 WHERE id = $2
       RETURNING id, nombre, email, rol, es_google, foto_perfil, creado_en`,
      [nombre, req.usuario.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });

    const usuario = result.rows[0];
    const rolNormalizado = usuario.rol === "propietario" ? "negocio" : usuario.rol;

    // NOTA: req.usuario.nombre (claim del JWT) queda desactualizado hasta el
    // próximo login/refresh, pero crearResena ya NO confía en ese claim
    // (lee de BD), así que no hay inconsistencia en reseñas nuevas.
    res.json({ ...usuario, rol: rolNormalizado });
  } catch (err) {
    console.error("[actualizarPerfil]", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// PUT /api/auth/password — cambiar contraseña (requiere auth, no aplica a cuentas Google)
async function cambiarPassword(req, res) {
  const { passwordActual, passwordNueva } = req.body;

  try {
    const result = await pool.query(
      "SELECT password, es_google, token_version FROM usuarios WHERE id = $1",
      [req.usuario.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });

    const usuario = result.rows[0];

    if (usuario.password) {
      if (!passwordActual) {
        return res.status(400).json({ error: "La contraseña actual es obligatoria" });
      }
      const coincide = await argon2.verify(usuario.password, passwordActual);
      if (!coincide)
        return res.status(401).json({ error: "La contraseña actual es incorrecta" });
    } else if (usuario.es_google) {
      // Usuario de Google configurando su contraseña por primera vez, no requiere passwordActual
    } else {
      return res.status(400).json({ error: "Estado de cuenta inválido para esta operación" });
    }

    const hashNuevo = await argon2.hash(passwordNueva);

    // SEGURIDAD: incrementar token_version invalida todas las sesiones
    // existentes (incluyendo la de un posible atacante con token robado).
    // El usuario actual debe volver a iniciar sesión.
    await pool.query(
      "UPDATE usuarios SET password = $1, token_version = token_version + 1 WHERE id = $2",
      [hashNuevo, req.usuario.id]
    );

    res.clearCookie("token", { ...COOKIE_OPTS, maxAge: 0 });
    res.json({ mensaje: "Contraseña actualizada. Por favor, inicia sesión de nuevo." });
  } catch (err) {
    console.error("[cambiarPassword]", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// POST /api/auth/foto — subir foto de perfil (requiere auth, multipart)
async function subirFotoPerfil(req, res) {
  if (!req.file)
    return res.status(400).json({ error: "No se recibió ningún archivo" });

  try {
    const filename = `${req.usuario.id}/${req.file.safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("fotosperfil")
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert:      true,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("fotosperfil")
      .getPublicUrl(filename);

    const result = await pool.query(
      `UPDATE usuarios SET foto_perfil = $1 WHERE id = $2
       RETURNING id, nombre, email, rol, es_google, foto_perfil, creado_en`,
      [publicUrl, req.usuario.id]
    );

    const usuario = result.rows[0];
    const rolNormalizado = usuario.rol === "propietario" ? "negocio" : usuario.rol;

    res.json({ ...usuario, rol: rolNormalizado });
  } catch (err) {
    console.error("[subirFotoPerfil]", err.message);
    res.status(500).json({ error: "Error al subir la foto de perfil" });
  }
}

module.exports = { registro, login, me, logout, actualizarPerfil, cambiarPassword, subirFotoPerfil };