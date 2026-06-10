const pool = require("../db/pool");

// ── Sedes ─────────────────────────────────────────────────────

// POST /api/negocios/:id/sedes
async function crearSede(req, res) {
  const { id: negocioId } = req.params;
  const { nombre, direccion, telefonos, lat, lng, horario, maps_url, referencia } = req.body;

  if (!nombre)
    return res.status(400).json({ error: "El nombre de la sede es obligatorio" });

  // Normalizar: acepta string o array, siempre guarda array
  const telArray = Array.isArray(telefonos)
    ? telefonos.filter(Boolean)
    : telefonos ? [telefonos] : [];

  try {
    const result = await pool.query(
      `INSERT INTO sedes (negocio_id, nombre, direccion, telefonos, lat, lng, horario, maps_url, referencia)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [negocioId, nombre, direccion, telArray, lat, lng, horario, maps_url, referencia]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error en crearSede:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// PUT /api/negocios/:id/sedes/:sedeId
async function actualizarSede(req, res) {
  const { id: negocioId, sedeId } = req.params;
  const { nombre, direccion, telefonos, lat, lng, horario, maps_url, referencia } = req.body;

  const telArray = telefonos !== undefined
    ? (Array.isArray(telefonos) ? telefonos.filter(Boolean) : [telefonos].filter(Boolean))
    : undefined;

  try {
    const result = await pool.query(
      `UPDATE sedes
       SET
         nombre     = COALESCE($1, nombre),
         direccion  = COALESCE($2, direccion),
         telefonos  = COALESCE($3, telefonos),
         lat        = COALESCE($4, lat),
         lng        = COALESCE($5, lng),
         horario    = COALESCE($6, horario),
         maps_url   = COALESCE($7, maps_url),
         referencia = COALESCE($8, referencia)
       WHERE id = $9 AND negocio_id = $10
       RETURNING *`,
      [nombre, direccion, telArray, lat, lng, horario, maps_url, referencia, sedeId, negocioId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Sede no encontrada" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error en actualizarSede:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// DELETE /api/negocios/:id/sedes/:sedeId
async function eliminarSede(req, res) {
  const { id: negocioId, sedeId } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM sedes WHERE id = $1 AND negocio_id = $2 RETURNING id",
      [sedeId, negocioId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Sede no encontrada" });

    res.json({ mensaje: "Sede eliminada" });
  } catch (err) {
    console.error("Error en eliminarSede:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = { crearSede, actualizarSede, eliminarSede };