const pool = require("../db/pool");

// POST /api/negocios/:id/resenas  (requiere auth)
async function crearResena(req, res) {
  const { id: negocioId } = req.params;
  const { estrellas, comentario } = req.body;
  const { id: usuarioId } = req.usuario;

  if (!estrellas || estrellas < 1 || estrellas > 5)
    return res.status(400).json({ error: "Las estrellas deben estar entre 1 y 5" });

  // Limitar longitud del comentario
  if (comentario && comentario.length > 1000)
    return res.status(400).json({ error: "El comentario no puede superar 1000 caracteres" });

  try {
    const negocio = await pool.query("SELECT id FROM negocios WHERE id = $1", [negocioId]);
    if (negocio.rows.length === 0)
      return res.status(404).json({ error: "Negocio no encontrado" });

    // SEGURIDAD/CONSISTENCIA: leer el nombre actual desde BD en vez de
    // confiar en req.usuario.nombre (claim del JWT, que puede tener hasta
    // 7 días de antigüedad). Evita reseñas con nombres "congelados" tras
    // un cambio de perfil o moderación de nombre por un admin.
    const usuario = await pool.query("SELECT nombre FROM usuarios WHERE id = $1", [usuarioId]);
    if (usuario.rows.length === 0)
      return res.status(401).json({ error: "Usuario no encontrado" });

    const nombreActual = usuario.rows[0].nombre;

    const result = await pool.query(
      `INSERT INTO resenas (negocio_id, usuario_id, usuario_nombre, estrellas, comentario)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, negocio_id, usuario_nombre, estrellas, comentario, creado_en`,
      [negocioId, usuarioId, nombreActual, estrellas, comentario || ""]
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
    // SEGURIDAD: no incluir usuario_id en respuesta pública (evita
    // enumeración de IDs de usuario vía reseñas).
    const result = await pool.query(
      `SELECT id, negocio_id, usuario_nombre, estrellas, comentario, creado_en
       FROM resenas WHERE negocio_id = $1 ORDER BY creado_en DESC`,
      [negocioId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("[getResenas]", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = { crearResena, getResenas };