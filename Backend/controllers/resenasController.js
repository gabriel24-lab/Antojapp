const prisma = require("../db/pool");
const { captureError } = require("../lib/sentry");

// POST /api/negocios/:id/resenas  (requiere auth)
async function crearResena(req, res) {
  const { id: negocioId } = req.params;
  const { estrellas, comentario } = req.body;
  const { id: usuarioId } = req.usuario;

  if (!estrellas || estrellas < 1 || estrellas > 5)
    return res
      .status(400)
      .json({ error: "Las estrellas deben estar entre 1 y 5" });

  if (comentario && comentario.length > 1000)
    return res
      .status(400)
      .json({ error: "El comentario no puede superar 1000 caracteres" });

  try {
    const negocio = await prisma.negocios.findUnique({
      where: { id: parseInt(negocioId) },
      select: { id: true },
    });
    if (!negocio)
      return res.status(404).json({ error: "Negocio no encontrado" });

    const usuario = await prisma.usuarios.findUnique({
      where: { id: usuarioId },
      select: { nombre: true },
    });
    if (!usuario)
      return res.status(401).json({ error: "Usuario no encontrado" });

    const nombreActual = usuario.nombre;

    const resena = await prisma.resenas.create({
      data: {
        negocio_id: parseInt(negocioId),
        usuario_id: usuarioId,
        usuario_nombre: nombreActual,
        estrellas,
        comentario: comentario || "",
      },
      select: {
        id: true,
        negocio_id: true,
        usuario_nombre: true,
        estrellas: true,
        comentario: true,
        creado_en: true,
      },
    });

    // Actualizar la calificación y el total de reseñas
    const agregacion = await prisma.resenas.aggregate({
      where: { negocio_id: parseInt(negocioId) },
      _avg: { estrellas: true },
      _count: { _all: true },
    });

    const promedioBruto = agregacion._avg.estrellas || 0;
    const promedioRedondeado = Math.round(promedioBruto * 10) / 10;
    const totalResenas = agregacion._count._all;

    await prisma.negocios.update({
      where: { id: parseInt(negocioId) },
      data: {
        calificacion: promedioRedondeado,
        total_resenas: totalResenas,
      },
    });

    res.status(201).json(resena);
  } catch (err) {
    if (err.code === "P2002")
      return res
        .status(409)
        .json({ error: "Ya dejaste una reseña en este negocio" });

    captureError(err, "[crearResena]");
    res
      .status(500)
      .json({
        error:
          "Ups, algo salió mal. Estamos trabajando en ello, por favor intenta de nuevo más tarde.",
      });
  }
}

// GET /api/negocios/:id/resenas
async function getResenas(req, res) {
  const { id: negocioId } = req.params;

  try {
    const resenas = await prisma.resenas.findMany({
      where: { negocio_id: parseInt(negocioId) },
      select: {
        id: true,
        negocio_id: true,
        usuario_nombre: true,
        estrellas: true,
        comentario: true,
        creado_en: true,
      },
      orderBy: { creado_en: "desc" },
    });
    res.json(resenas);
  } catch (err) {
    captureError(err, "[getResenas]");
    res
      .status(500)
      .json({
        error:
          "Ups, algo salió mal. Estamos trabajando en ello, por favor intenta de nuevo más tarde.",
      });
  }
}

module.exports = { crearResena, getResenas };
