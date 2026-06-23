const pool = require("../db/pool");

// Middleware: verifica que el negocio con :id le pertenece al usuario autenticado.
// Debe usarse DESPUÉS del middleware 'auth' y de tener :id en los params.
async function esPropietario(req, res, next) {
  const { id } = req.params;
  const usuarioId = req.usuario?.id;

  try {
    const result = await pool.query(
      "SELECT propietario_id FROM negocios WHERE id = $1",
      [id],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Negocio no encontrado" });

    if (result.rows[0].propietario_id !== usuarioId)
      return res
        .status(403)
        .json({ error: "No tienes permiso para modificar este negocio" });

    next();
  } catch (err) {
    console.error("[esPropietario]", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = esPropietario;
