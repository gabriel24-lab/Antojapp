const pool = require("../db/pool");

// POST /api/negocios/:id/resenas  (requiere auth)
async function crearResena(req, res) {
  const { id: negocioId } = req.params;
  const { estrellas, comentario } = req.body;
  const { id: usuarioId, nombre } = req.usuario;

  if (!estrellas || estrellas < 1 || estrellas > 5)
    return res.status(400).json({ error: "Las estrellas deben estar entre 1 y 5" });

  try {
    // Verificar que el negocio exista
    const negocio = await pool.query("SELECT id FROM negocios WHERE id = $1", [negocioId]);
    if (negocio.rows.length === 0)
      return res.status(404).json({ error: "Negocio no encontrado" });

    // Insertar reseña
    const result = await pool.query(
      `INSERT INTO resenas (negocio_id, usuario_id, usuario_nombre, estrellas, comentario)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [negocioId, usuarioId, nombre, estrellas, comentario || ""]
    );

    // Recalcular calificación promedio del negocio
    await pool.query(
      `UPDATE negocios
       SET calificacion   = (SELECT ROUND(AVG(estrellas)::numeric, 1) FROM resenas WHERE negocio_id = $1),
           total_resenas  = (SELECT COUNT(*) FROM resenas WHERE negocio_id = $1)
       WHERE id = $1`,
      [negocioId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error en crearResena:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// GET /api/negocios/:id/resenas
async function getResenas(req, res) {
  const { id: negocioId } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM resenas WHERE negocio_id = $1 ORDER BY creado_en DESC",
      [negocioId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error en getResenas:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = { crearResena, getResenas };
