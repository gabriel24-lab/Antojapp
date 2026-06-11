const pool = require("../db/pool");

// POST /api/negocios/:id/resenas  (requiere auth)
async function crearResena(req, res) {
  const { id: negocioId } = req.params;
  const { estrellas, comentario } = req.body;
  const { id: usuarioId, nombre } = req.usuario;

  if (!estrellas || estrellas < 1 || estrellas > 5)
    return res.status(400).json({ error: "Las estrellas deben estar entre 1 y 5" });

  // Limitar longitud del comentario
  if (comentario && comentario.length > 1000)
    return res.status(400).json({ error: "El comentario no puede superar 1000 caracteres" });

  try {
    const negocio = await pool.query("SELECT id FROM negocios WHERE id = $1", [negocioId]);
    if (negocio.rows.length === 0)
      return res.status(404).json({ error: "Negocio no encontrado" });

    const result = await pool.query(
      `INSERT INTO resenas (negocio_id, usuario_id, usuario_nombre, estrellas, comentario)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [negocioId, usuarioId, nombre, estrellas, comentario || ""]
    );

    await pool.query(
      `UPDATE negocios
       SET calificacion   = (SELECT ROUND(AVG(estrellas)::numeric, 1) FROM resenas WHERE negocio_id = $1),
           total_resenas  = (SELECT COUNT(*) FROM resenas WHERE negocio_id = $1)
       WHERE id = $1`,
      [negocioId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    // Capturar violación de constraint UNIQUE(negocio_id, usuario_id)
    if (err.code === "23505")
      return res.status(409).json({ error: "Ya dejaste una reseña en este negocio" });

    console.error("[crearResena]", err.message);
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
    console.error("[getResenas]", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = { crearResena, getResenas };
