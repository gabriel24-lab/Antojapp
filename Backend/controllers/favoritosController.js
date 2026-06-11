const pool = require("../db/pool");

// GET /api/favoritos  — favoritos del usuario autenticado
async function getFavoritos(req, res) {
  const { id: usuarioId } = req.usuario;

  try {
    const result = await pool.query(
      `SELECT
         n.*,
         COALESCE(
           json_agg(
             json_build_object(
               'id', s.id, 'nombre', s.nombre, 'direccion', s.direccion,
               'telefono', s.telefono, 'lat', s.lat, 'lng', s.lng, 'horario', s.horario
             )
           ) FILTER (WHERE s.id IS NOT NULL),
           '[]'
         ) AS sedes
       FROM favoritos f
       JOIN negocios n ON n.id = f.negocio_id
       LEFT JOIN sedes s ON s.negocio_id = n.id
       WHERE f.usuario_id = $1
       GROUP BY n.id
       ORDER BY f.guardado_en DESC`,
      [usuarioId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("[getFavoritos]", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// POST /api/favoritos/:negocioId  — agregar favorito
async function agregarFavorito(req, res) {
  const { id: usuarioId }   = req.usuario;
  const { negocioId }       = req.params;

  try {
    await pool.query(
      `INSERT INTO favoritos (usuario_id, negocio_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [usuarioId, negocioId]
    );
    res.status(201).json({ mensaje: "Favorito agregado" });
  } catch (err) {
    console.error("[agregarFavorito]", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// DELETE /api/favoritos/:negocioId  — quitar favorito
async function quitarFavorito(req, res) {
  const { id: usuarioId } = req.usuario;
  const { negocioId }     = req.params;

  try {
    await pool.query(
      "DELETE FROM favoritos WHERE usuario_id = $1 AND negocio_id = $2",
      [usuarioId, negocioId]
    );
    res.json({ mensaje: "Favorito eliminado" });
  } catch (err) {
    console.error("[quitarFavorito]", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// GET /api/favoritos/ids  — solo los IDs (para saber cuáles están guardados)
async function getFavoritosIds(req, res) {
  const { id: usuarioId } = req.usuario;

  try {
    const result = await pool.query(
      "SELECT negocio_id FROM favoritos WHERE usuario_id = $1",
      [usuarioId]
    );
    res.json(result.rows.map(r => r.negocio_id));
  } catch (err) {
    console.error("[getFavoritosIds]", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = { getFavoritos, agregarFavorito, quitarFavorito, getFavoritosIds };
