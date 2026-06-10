const pool     = require("../db/pool");
const supabase = require("../db/supabase");

// ── Platos ────────────────────────────────────────────────────

// GET /api/negocios/:id/platos  (público)
async function getPlatos(req, res) {
  const { id: negocioId } = req.params;

  try {
    const result = await pool.query(
      `SELECT p.*,
        COALESCE(
          json_agg(
            json_build_object('dia', pd.dia, 'precio_descuento', pd.precio_descuento)
          ) FILTER (WHERE pd.id IS NOT NULL),
          '[]'
        ) AS descuentos
       FROM platos p
       LEFT JOIN plato_descuentos pd ON pd.plato_id = p.id
       WHERE p.negocio_id = $1
       GROUP BY p.id
       ORDER BY p.tipo, p.nombre`,
      [negocioId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error en getPlatos:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// POST /api/negocios/:id/platos
async function crearPlato(req, res) {
  const { id: negocioId } = req.params;
  const { nombre, descripcion, tipo, precio, disponible = true, descuentos = [] } = req.body;

  // tipo: 'estrella' | 'economico' | 'premium' | 'menu'
  if (!nombre || !tipo || precio === undefined)
    return res.status(400).json({ error: "nombre, tipo y precio son obligatorios" });

  const tiposValidos = ["estrella", "economico", "premium", "menu"];
  if (!tiposValidos.includes(tipo))
    return res.status(400).json({ error: `tipo debe ser uno de: ${tiposValidos.join(", ")}` });

  try {
    const result = await pool.query(
      `INSERT INTO platos (negocio_id, nombre, descripcion, tipo, precio, disponible)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [negocioId, nombre.trim(), descripcion || "", tipo, precio, disponible]
    );

    const plato = result.rows[0];

    // Insertar descuentos por día si vienen
    if (descuentos.length > 0) {
      const descPromises = descuentos.map(d =>
        pool.query(
          "INSERT INTO plato_descuentos (plato_id, dia, precio_descuento) VALUES ($1,$2,$3)",
          [plato.id, d.dia, d.precio_descuento]
        )
      );
      await Promise.all(descPromises);
    }

    res.status(201).json(plato);
  } catch (err) {
    console.error("Error en crearPlato:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// PUT /api/negocios/:id/platos/:platoId
async function actualizarPlato(req, res) {
  const { id: negocioId, platoId } = req.params;
  const { nombre, descripcion, tipo, precio, disponible, descuentos } = req.body;

  try {
    const result = await pool.query(
      `UPDATE platos
       SET
         nombre      = COALESCE($1, nombre),
         descripcion = COALESCE($2, descripcion),
         tipo        = COALESCE($3, tipo),
         precio      = COALESCE($4, precio),
         disponible  = COALESCE($5, disponible)
       WHERE id = $6 AND negocio_id = $7
       RETURNING *`,
      [nombre, descripcion, tipo, precio, disponible, platoId, negocioId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Plato no encontrado" });

    // Actualizar descuentos: eliminar los viejos e insertar los nuevos
    if (descuentos !== undefined) {
      await pool.query("DELETE FROM plato_descuentos WHERE plato_id = $1", [platoId]);
      if (descuentos.length > 0) {
        const descPromises = descuentos.map(d =>
          pool.query(
            "INSERT INTO plato_descuentos (plato_id, dia, precio_descuento) VALUES ($1,$2,$3)",
            [platoId, d.dia, d.precio_descuento]
          )
        );
        await Promise.all(descPromises);
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error en actualizarPlato:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// DELETE /api/negocios/:id/platos/:platoId
async function eliminarPlato(req, res) {
  const { id: negocioId, platoId } = req.params;

  try {
    // Eliminar foto de Storage si existe
    const plato = await pool.query(
      "SELECT foto FROM platos WHERE id = $1 AND negocio_id = $2",
      [platoId, negocioId]
    );

    if (plato.rows.length === 0)
      return res.status(404).json({ error: "Plato no encontrado" });

    if (plato.rows[0].foto) {
      const path = plato.rows[0].foto.split("/platos/")[1];
      if (path) await supabase.storage.from("platos").remove([path]);
    }

    await pool.query(
      "DELETE FROM platos WHERE id = $1 AND negocio_id = $2",
      [platoId, negocioId]
    );

    res.json({ mensaje: "Plato eliminado" });
  } catch (err) {
    console.error("Error en eliminarPlato:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// POST /api/negocios/:id/platos/:platoId/foto  — subir foto del plato
async function subirFotoPlato(req, res) {
  const { id: negocioId, platoId } = req.params;

  if (!req.file)
    return res.status(400).json({ error: "No se recibió ningún archivo" });

  try {
    const ext      = req.file.originalname.split(".").pop();
    const filename = `${negocioId}/${platoId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("platos")
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert:      true,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("platos")
      .getPublicUrl(filename);

    await pool.query(
      "UPDATE platos SET foto = $1 WHERE id = $2 AND negocio_id = $3",
      [publicUrl, platoId, negocioId]
    );

    res.json({ url: publicUrl });
  } catch (err) {
    console.error("Error en subirFotoPlato:", err);
    res.status(500).json({ error: "Error al subir la foto del plato" });
  }
}

module.exports = { getPlatos, crearPlato, actualizarPlato, eliminarPlato, subirFotoPlato };
