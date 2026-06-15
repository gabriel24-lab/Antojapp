const prisma = require("../db/pool");
const { captureError } = require("../lib/sentry");

// GET /api/favoritos  — favoritos del usuario autenticado
async function getFavoritos(req, res) {
  const { id: usuarioId } = req.usuario;

  try {
    const favoritos = await prisma.favoritos.findMany({
      where: { usuario_id: usuarioId },
      include: {
        negocio: {
          include: {
            sedes: true
          }
        }
      },
      orderBy: { guardado_en: 'desc' }
    });

    const negocios = favoritos.map(f => f.negocio);
    res.json(negocios);
  } catch (err) {
    captureError(err, "[getFavoritos]");
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// POST /api/favoritos/:negocioId  — agregar favorito
async function agregarFavorito(req, res) {
  const { id: usuarioId }   = req.usuario;
  const { negocioId }       = req.params;

  try {
    await prisma.favoritos.create({
      data: {
        usuario_id: usuarioId,
        negocio_id: parseInt(negocioId, 10)
      }
    });
    res.status(201).json({ mensaje: "Favorito agregado" });
  } catch (err) {
    if (err.code === 'P2002') {
      // Ya existía, se ignora como en el ON CONFLICT DO NOTHING
      return res.status(201).json({ mensaje: "Favorito agregado" });
    }
    captureError(err, "[agregarFavorito]");
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// DELETE /api/favoritos/:negocioId  — quitar favorito
async function quitarFavorito(req, res) {
  const { id: usuarioId } = req.usuario;
  const { negocioId }     = req.params;

  try {
    await prisma.favoritos.delete({
      where: {
        usuario_id_negocio_id: {
          usuario_id: usuarioId,
          negocio_id: parseInt(negocioId, 10)
        }
      }
    });
    res.json({ mensaje: "Favorito eliminado" });
  } catch (err) {
    if (err.code === 'P2025') {
      // No existía, se ignora para ser idempotente
      return res.json({ mensaje: "Favorito eliminado" });
    }
    captureError(err, "[quitarFavorito]");
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// GET /api/favoritos/ids  — solo los IDs (para saber cuáles están guardados)
async function getFavoritosIds(req, res) {
  const { id: usuarioId } = req.usuario;

  try {
    const favoritos = await prisma.favoritos.findMany({
      where: { usuario_id: usuarioId },
      select: { negocio_id: true }
    });
    res.json(favoritos.map(f => f.negocio_id));
  } catch (err) {
    captureError(err, "[getFavoritosIds]");
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = { getFavoritos, agregarFavorito, quitarFavorito, getFavoritosIds };