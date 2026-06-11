const pool = require("../db/pool");

// GET /api/panel/estadisticas  — dashboard del propietario autenticado
async function getEstadisticas(req, res) {
  const propietarioId = req.usuario.id;

  try {
    // 1. Obtener negocio del propietario
    const negocioResult = await pool.query(
      "SELECT id, nombre FROM negocios WHERE propietario_id = $1",
      [propietarioId]
    );

    if (negocioResult.rows.length === 0)
      return res.status(404).json({ error: "No tienes ningún negocio registrado" });

    const negocioId = negocioResult.rows[0].id;

    // 2. Ejecutar todas las consultas en paralelo
    const [
      visitasTotal,
      visitasSemana,
      visitasPorDia,
      totalFavoritos,
      totalResenas,
      promedioEstrellas,
      ultimasResenas,
    ] = await Promise.all([

      // Total de visitas históricas
      pool.query(
        "SELECT COUNT(*) AS total FROM visitas WHERE negocio_id = $1",
        [negocioId]
      ),

      // Visitas en los últimos 7 días
      pool.query(
        `SELECT COUNT(*) AS total
         FROM visitas
         WHERE negocio_id = $1
           AND visitado_en >= NOW() - INTERVAL '7 days'`,
        [negocioId]
      ),

      // Visitas agrupadas por día (últimos 30 días) para el gráfico
      pool.query(
        `SELECT
           DATE(visitado_en) AS dia,
           COUNT(*)          AS visitas
         FROM visitas
         WHERE negocio_id = $1
           AND visitado_en >= NOW() - INTERVAL '30 days'
         GROUP BY DATE(visitado_en)
         ORDER BY dia ASC`,
        [negocioId]
      ),

      // Total de veces guardado como favorito
      pool.query(
        "SELECT COUNT(*) AS total FROM favoritos WHERE negocio_id = $1",
        [negocioId]
      ),

      // Total de reseñas
      pool.query(
        "SELECT COUNT(*) AS total FROM resenas WHERE negocio_id = $1",
        [negocioId]
      ),

      // Promedio de estrellas
      pool.query(
        "SELECT ROUND(AVG(estrellas)::numeric, 1) AS promedio FROM resenas WHERE negocio_id = $1",
        [negocioId]
      ),

      // Últimas 5 reseñas
      pool.query(
        `SELECT usuario_nombre, estrellas, comentario, creado_en
         FROM resenas
         WHERE negocio_id = $1
         ORDER BY creado_en DESC
         LIMIT 5`,
        [negocioId]
      ),
    ]);

    res.json({
      negocio: negocioResult.rows[0],
      visitas: {
        total:     parseInt(visitasTotal.rows[0].total),
        semana:    parseInt(visitasSemana.rows[0].total),
        porDia:    visitasPorDia.rows,            // [{ dia: "2026-06-01", visitas: 12 }, ...]
      },
      favoritos:   parseInt(totalFavoritos.rows[0].total),
      resenas: {
        total:     parseInt(totalResenas.rows[0].total),
        promedio:  parseFloat(promedioEstrellas.rows[0].promedio) || 0,
        ultimas:   ultimasResenas.rows,
      },
    });
  } catch (err) {
    console.error("[getEstadisticas]", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = { getEstadisticas };
