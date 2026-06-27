const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const prisma = require("../db/pool");
const supabase = require("../db/supabase");
const { captureError } = require("../lib/sentry");

// Configuración de la cookie HttpOnly
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // solo HTTPS en prod
  // "none" es obligatorio para cookies cross-site (frontend en pages.dev, backend en onrender.com).
  // Requiere secure: true (HTTPS), por eso solo se usa "none" en producción.
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en ms
  path: "/",
};

function generarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      tv: usuario.token_version,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}

// ── Validaciones reutilizables ─────────────────────────────────
function validarPassword(password) {
  if (!password || password.length < 6)
    return "La contraseña debe tener al menos 6 caracteres";
  return null;
}

// POST /api/auth/registro
async function registro(req, res) {
  const { nombre, email, password, rol } = req.body;

  if (!nombre || !email || !password)
    return res.status(400).json({ error: "Todos los campos son obligatorios" });

  // Validar longitudes para prevenir ataques de campos enormes
  if (nombre.length > 100)
    return res
      .status(400)
      .json({ error: "El nombre no puede superar 100 caracteres" });
  if (email.length > 254)
    return res.status(400).json({ error: "Email inválido" });
  if (password.length > 128)
    return res
      .status(400)
      .json({ error: "La contraseña no puede superar 128 caracteres" });

  const errorPassword = validarPassword(password);
  if (errorPassword) return res.status(400).json({ error: errorPassword });

  // Normalizar: "propietario" se guarda como "negocio" para consistencia
  const rolNormalizado =
    rol === "negocio" || rol === "propietario" ? "negocio" : "usuario";

  try {
    const existe = await prisma.usuarios.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
    if (existe)
      return res.status(409).json({ error: "Este correo ya está registrado" });

    const hash = await argon2.hash(password);

    const usuario = await prisma.usuarios.create({
      data: {
        nombre: nombre.trim(),
        email: email.toLowerCase(),
        password: hash,
        rol: rolNormalizado,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        token_version: true,
      },
    });

    const token = generarToken(usuario);

    // Emitir JWT en cookie HttpOnly
    res.cookie("token", token, COOKIE_OPTS);

    res.status(201).json({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (err) {
    captureError(err, "[registro]");
    res
      .status(500)
      .json({
        error:
          "Ups, algo salió mal. Estamos trabajando en ello, por favor intenta de nuevo más tarde.",
      });
  }
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password)
    return res
      .status(400)
      .json({ error: "Correo y contraseña son obligatorios" });

  if (email.length > 254 || password.length > 128)
    return res.status(400).json({ error: "Credenciales inválidas" });

  try {
    const usuario = await prisma.usuarios.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Respuesta genérica para no revelar si el email existe
    if (!usuario) {
      await argon2.hash("dummy_para_tiempo_constante"); // evitar timing attack
      return res.status(401).json({ error: "Correo o contraseña incorrectos" });
    }

    if (usuario.es_google)
      return res
        .status(400)
        .json({ error: "Esta cuenta usa Google para iniciar sesión" });

    const coincide = await argon2.verify(usuario.password, password);
    if (!coincide)
      return res.status(401).json({ error: "Correo o contraseña incorrectos" });

    // Normalizar rol legacy
    const rolNormalizado =
      usuario.rol === "propietario" ? "negocio" : usuario.rol;
    const usuarioNormalizado = { ...usuario, rol: rolNormalizado };

    const token = generarToken(usuarioNormalizado);

    // Emitir JWT en cookie HttpOnly
    res.cookie("token", token, COOKIE_OPTS);

    res.json({
      usuario: {
        id: usuarioNormalizado.id,
        nombre: usuarioNormalizado.nombre,
        email: usuarioNormalizado.email,
        rol: usuarioNormalizado.rol,
      },
    });
  } catch (err) {
    captureError(err, "[login]");
    res
      .status(500)
      .json({
        error:
          "Ups, algo salió mal. Estamos trabajando en ello, por favor intenta de nuevo más tarde.",
      });
  }
}

// GET /api/auth/me  (requiere token)
async function me(req, res) {
  try {
    const usuario = await prisma.usuarios.findUnique({
      where: { id: req.usuario.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        es_google: true,
        foto_perfil: true,
        creado_en: true,
      },
    });

    if (!usuario)
      return res.status(404).json({ error: "Usuario no encontrado" });

    const rolNormalizado =
      usuario.rol === "propietario" ? "negocio" : usuario.rol;

    res.json({ ...usuario, rol: rolNormalizado });
  } catch (err) {
    captureError(err, "[me]");
    res
      .status(500)
      .json({
        error:
          "Ups, algo salió mal. Estamos trabajando en ello, por favor intenta de nuevo más tarde.",
      });
  }
}

// POST /api/auth/logout
async function logout(req, res) {
  try {
    await prisma.usuarios.update({
      where: { id: req.usuario.id },
      data: { token_version: { increment: 1 } },
    });
  } catch (err) {
    captureError(err, "[logout]");
  }

  res.clearCookie("token", { ...COOKIE_OPTS, maxAge: 0 });
  res.json({ mensaje: "Sesión cerrada" });
}

// PUT /api/auth/perfil
async function actualizarPerfil(req, res) {
  const { nombre } = req.body;

  try {
    const usuario = await prisma.usuarios.update({
      where: { id: req.usuario.id },
      data: { nombre },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        es_google: true,
        foto_perfil: true,
        creado_en: true,
      },
    });

    const rolNormalizado =
      usuario.rol === "propietario" ? "negocio" : usuario.rol;

    res.json({ ...usuario, rol: rolNormalizado });
  } catch (err) {
    captureError(err, "[actualizarPerfil]");
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res
      .status(500)
      .json({
        error:
          "Ups, algo salió mal. Estamos trabajando en ello, por favor intenta de nuevo más tarde.",
      });
  }
}

// PUT /api/auth/password
async function cambiarPassword(req, res) {
  const { passwordActual, passwordNueva } = req.body;

  try {
    const usuario = await prisma.usuarios.findUnique({
      where: { id: req.usuario.id },
      select: { password: true, es_google: true, token_version: true },
    });

    if (!usuario)
      return res.status(404).json({ error: "Usuario no encontrado" });

    if (usuario.password) {
      if (!passwordActual) {
        return res
          .status(400)
          .json({ error: "La contraseña actual es obligatoria" });
      }
      const coincide = await argon2.verify(usuario.password, passwordActual);
      if (!coincide)
        return res
          .status(401)
          .json({ error: "La contraseña actual es incorrecta" });
    } else if (usuario.es_google) {
      // Usuario de Google configurando su contraseña por primera vez
    } else {
      return res
        .status(400)
        .json({ error: "Estado de cuenta inválido para esta operación" });
    }

    const hashNuevo = await argon2.hash(passwordNueva);

    await prisma.usuarios.update({
      where: { id: req.usuario.id },
      data: {
        password: hashNuevo,
        token_version: { increment: 1 },
      },
    });

    res.clearCookie("token", { ...COOKIE_OPTS, maxAge: 0 });
    res.json({
      mensaje: "Contraseña actualizada. Por favor, inicia sesión de nuevo.",
    });
  } catch (err) {
    captureError(err, "[cambiarPassword]");
    res
      .status(500)
      .json({
        error:
          "Ups, algo salió mal. Estamos trabajando en ello, por favor intenta de nuevo más tarde.",
      });
  }
}

// POST /api/auth/foto
async function subirFotoPerfil(req, res) {
  if (!req.file)
    return res.status(400).json({ error: "No se recibió ningún archivo" });

  try {
    const filename = `${req.usuario.id}/${req.file.safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("fotosperfil")
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("fotosperfil").getPublicUrl(filename);

    const usuario = await prisma.usuarios.update({
      where: { id: req.usuario.id },
      data: { foto_perfil: publicUrl },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        es_google: true,
        foto_perfil: true,
        creado_en: true,
      },
    });

    const rolNormalizado =
      usuario.rol === "propietario" ? "negocio" : usuario.rol;

    res.json({ ...usuario, rol: rolNormalizado });
  } catch (err) {
    captureError(err, "[subirFotoPerfil]");
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res
      .status(500)
      .json({
        error: "Tuvimos un problema al subir tu foto. Inténtalo más tarde.",
      });
  }
}

module.exports = {
  registro,
  login,
  me,
  logout,
  actualizarPerfil,
  cambiarPassword,
  subirFotoPerfil,
};
