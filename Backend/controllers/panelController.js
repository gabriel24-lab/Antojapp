const prisma = require("../db/pool");
const { captureError } = require("../lib/sentry");

// GET /api/panel/estadisticas  — dashboard del propietario autenticado
async function getEstadisticas(req, res) {
  const propietarioId = req.usuario.id;

  try {
    // 1. Obtener negocio del propietario
    const negocio = await prisma.negocios.findFirst({
      where: { propietario_id: propietarioId },
      select: { id: true, nombre: true }
    });

    if (!negocio)
      return res.status(404).json({ error: "No tienes ningún negocio registrado" });

    const negocioId = negocio.id;

    // 2. Ejecutar consultas en paralelo
    const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      visitasTotal,
      visitasSemana,
      visitas30Dias,
      totalFavoritos,
      totalResenas,
      agregacionResenas,
      ultimasResenas,
    ] = await Promise.all([
      // Total de visitas históricas
      prisma.visitas.count({ where: { negocio_id: negocioId } }),

      // Visitas en los últimos 7 días
      prisma.visitas.count({
        where: {
          negocio_id: negocioId,
          visitado_en: { gte: hace7Dias }
        }
      }),

      // Visitas en los últimos 30 días para agrupar
      prisma.visitas.findMany({
        where: {
          negocio_id: negocioId,
          visitado_en: { gte: hace30Dias }
        },
        select: { visitado_en: true }
      }),

      // Total de veces guardado como favorito
      prisma.favoritos.count({ where: { negocio_id: negocioId } }),

      // Total de reseñas
      prisma.resenas.count({ where: { negocio_id: negocioId } }),

      // Promedio de estrellas
      prisma.resenas.aggregate({
        where: { negocio_id: negocioId },
        _avg: { estrellas: true }
      }),

      // Últimas 5 reseñas
      prisma.resenas.findMany({
        where: { negocio_id: negocioId },
        orderBy: { creado_en: 'desc' },
        take: 5,
        select: { usuario_nombre: true, estrellas: true, comentario: true, creado_en: true }
      }),
    ]);

    // Procesar visitas por día
    const visitasMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      visitasMap[d.toISOString().slice(0, 10)] = 0;
    }

    visitas30Dias.forEach(v => {
      if (v.visitado_en) {
        const diaStr = v.visitado_en.toISOString().slice(0, 10);
        if (visitasMap[diaStr] !== undefined) {
          visitasMap[diaStr]++;
        }
      }
    });

    const porDia = Object.keys(visitasMap).sort().map(dia => ({
      dia,
      visitas: visitasMap[dia]
    }));

    const promedioRedondeado = Math.round((agregacionResenas._avg.estrellas || 0) * 10) / 10;

    res.json({
      negocio,
      visitas: {
        total:  visitasTotal,
        semana: visitasSemana,
        porDia: porDia,
      },
      favoritos: totalFavoritos,
      resenas: {
        total:   totalResenas,
        promedio: promedioRedondeado,
        ultimas:  ultimasResenas,
      },
    });
  } catch (err) {
    captureError(err, "[getEstadisticas]");
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// ── Panel de administración: verificación de negocios ─────────
// Requiere rol 'admin' (verificado en middleware esAdmin).

// GET /api/panel/admin/negocios?estado=pendiente
async function getAdminNegocios(req, res) {
  const { estado = "pendiente" } = req.query;

  const estadosValidos = ["pendiente", "aprobado", "rechazado"];
  if (!estadosValidos.includes(estado))
    return res.status(400).json({ error: "Estado inválido" });

  try {
    const negocios = await prisma.negocios.findMany({
      where: { estado },
      select: {
        id: true,
        nombre: true,
        categoria: true,
        descripcion: true,
        estado: true,
        creado_en: true,
        propietario: {
          select: { nombre: true, email: true }
        }
      },
      orderBy: { creado_en: 'asc' }
    });

    // Mapear para mantener compatibilidad con el frontend
    const result = negocios.map(n => ({
      ...n,
      propietario: n.propietario ? n.propietario.nombre : null,
      propietario_email: n.propietario ? n.propietario.email : null
    }));

    res.json(result);
  } catch (err) {
    captureError(err, "[getAdminNegocios]");
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// PATCH /api/panel/admin/negocios/:id/estado
async function actualizarEstadoNegocio(req, res) {
  const { id }     = req.params;
  const { estado } = req.body;

  const estadosValidos = ["aprobado", "rechazado"];
  if (!estadosValidos.includes(estado))
    return res.status(400).json({ error: "Estado debe ser 'aprobado' o 'rechazado'" });

  try {
    const negocio = await prisma.negocios.update({
      where: { id: parseInt(id) },
      data: {
        estado,
        activo: estado === "aprobado"
      },
      select: { id: true, nombre: true, estado: true }
    });

    res.json(negocio);
  } catch (err) {
    if (err.code === 'P2025') {
        return res.status(404).json({ error: "Negocio no encontrado" });
    }
    captureError(err, "[actualizarEstadoNegocio]");
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = { getEstadisticas, getAdminNegocios, actualizarEstadoNegocio };
