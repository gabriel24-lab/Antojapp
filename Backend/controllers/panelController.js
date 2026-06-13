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

      // Visitas agrupadas por día (últimos 30 días) — rellena días sin visitas con 0
      pool.query(
        `SELECT
           gs.dia::date                          AS dia,
           COALESCE(v.visitas, 0)::int           AS visitas
         FROM generate_series(
           (NOW() - INTERVAL '29 days')::date,
           NOW()::date,
           '1 day'::interval
         ) AS gs(dia)
         LEFT JOIN (
           SELECT DATE(visitado_en) AS dia, COUNT(*) AS visitas
           FROM visitas
           WHERE negocio_id = $1
             AND visitado_en >= NOW() - INTERVAL '30 days'
           GROUP BY DATE(visitado_en)
         ) v ON v.dia = gs.dia
         ORDER BY gs.dia ASC`,
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
        total:  parseInt(visitasTotal.rows[0].total),
        semana: parseInt(visitasSemana.rows[0].total),
        // Serializar dia como string ISO "YYYY-MM-DD" para evitar que el driver
        // de pg lo envíe como objeto Date, lo que rompe la gráfica en el frontend
        porDia: visitasPorDia.rows.map(r => ({
          dia:     r.dia instanceof Date
            ? r.dia.toISOString().slice(0, 10)
            : String(r.dia).slice(0, 10),
          visitas: parseInt(r.visitas) || 0,
        })),
      },
      favoritos: parseInt(totalFavoritos.rows[0].total),
      resenas: {
        total:   parseInt(totalResenas.rows[0].total),
        promedio: parseFloat(promedioEstrellas.rows[0].promedio) || 0,
        ultimas:  ultimasResenas.rows,
      },
    });
  } catch (err) {
    console.error("[getEstadisticas]", err.message);
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
    const result = await pool.query(
      `SELECT n.id, n.nombre, n.categoria, n.descripcion, n.estado,
              n.creado_en, u.nombre AS propietario, u.email AS propietario_email
       FROM negocios n
       JOIN usuarios u ON u.id = n.propietario_id
       WHERE n.estado = $1
       ORDER BY n.creado_en ASC`,
      [estado]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("[getAdminNegocios]", err.message);
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
    const result = await pool.query(
      `UPDATE negocios
       SET estado = $1, activo = $2
       WHERE id = $3
       RETURNING id, nombre, estado`,
      [estado, estado === "aprobado", id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Negocio no encontrado" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("[actualizarEstadoNegocio]", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = { getEstadisticas, getAdminNegocios, actualizarEstadoNegocio };
