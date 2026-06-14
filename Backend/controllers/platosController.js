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
            json_build_object('dia', pd.dia, 'precio_descuento', pd.precio_desc)
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
    console.error("[getPlatos]", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// POST /api/negocios/:id/platos
async function crearPlato(req, res) {
  const { id: negocioId } = req.params;
  const { nombre, descripcion, tipo, precio, disponible = true, descuentos = [], foto_menu_b } = req.body;

  const esMenu = tipo?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === "menu";

  if (!nombre || !tipo)
    return res.status(400).json({ error: "nombre y tipo son obligatorios" });

  // Los menús no requieren precio
  if (!esMenu && precio === undefined)
    return res.status(400).json({ error: "El precio es obligatorio para platos que no son menú" });

  if (tipo.length > 50)
    return res.status(400).json({ error: "El tipo no puede superar 50 caracteres" });

  try {
    const precioFinal = esMenu ? null : parseInt(precio);

    const result = await pool.query(
      `INSERT INTO platos (negocio_id, nombre, descripcion, tipo, precio, foto_menu_b, disponible)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [negocioId, nombre.trim(), descripcion || "", tipo, precioFinal, foto_menu_b || null, disponible]
    );

    const plato = result.rows[0];

    // Insertar descuentos por día si vienen
    if (descuentos.length > 0) {
      const descPromises = descuentos.map(d =>
        pool.query(
          "INSERT INTO plato_descuentos (plato_id, dia, precio_desc) VALUES ($1,$2,$3)",
          [plato.id, d.dia, d.precio_desc]
        )
      );
      await Promise.all(descPromises);
    }

    res.status(201).json(plato);
  } catch (err) {
    console.error("[crearPlato]", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// PUT /api/negocios/:id/platos/:platoId
async function actualizarPlato(req, res) {
  const { id: negocioId, platoId } = req.params;
  const { nombre, descripcion, tipo, precio, disponible, descuentos, foto_menu_b } = req.body;

  try {
    const result = await pool.query(
      `UPDATE platos
       SET
         nombre      = COALESCE($1, nombre),
         descripcion = COALESCE($2, descripcion),
         tipo        = COALESCE($3, tipo),
         precio      = COALESCE($4, precio),
         disponible  = COALESCE($5, disponible),
         foto_menu_b = COALESCE($6, foto_menu_b)
       WHERE id = $7 AND negocio_id = $8
       RETURNING *`,
      [nombre, descripcion, tipo, precio !== undefined ? precio : null, disponible, foto_menu_b, platoId, negocioId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Plato no encontrado" });

    // Actualizar descuentos: eliminar los viejos e insertar los nuevos
    if (descuentos !== undefined) {
      await pool.query("DELETE FROM plato_descuentos WHERE plato_id = $1", [platoId]);
      if (descuentos.length > 0) {
        const descPromises = descuentos.map(d =>
          pool.query(
            "INSERT INTO plato_descuentos (plato_id, dia, precio_desc) VALUES ($1,$2,$3)",
            [platoId, d.dia, d.precio_desc]
          )
        );
        await Promise.all(descPromises);
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("[actualizarPlato]", err.message);
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
    console.error("[eliminarPlato]", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// POST /api/negocios/:id/platos/:platoId/foto  — subir foto del plato
// Query param ?lado=b para guardar en foto_menu_b (segunda cara del menú)
// SEGURIDAD: se verifica que platoId pertenezca a negocioId ANTES de subir
// el archivo a Storage. Esto evita que un propietario autenticado (validado
// solo como dueño de :id por esPropietario) pueda escribir archivos en rutas
// de Storage de OTRO negocio usando un platoId ajeno.
async function subirFotoPlato(req, res) {
  const { id: negocioId, platoId } = req.params;
  const lado = req.query.lado === "b" ? "b" : "a";

  if (!req.file)
    return res.status(400).json({ error: "No se recibió ningún archivo" });

  try {
    // 1. Verificar pertenencia ANTES de tocar Storage
    const plato = await pool.query(
      "SELECT id FROM platos WHERE id = $1 AND negocio_id = $2",
      [platoId, negocioId]
    );

    if (plato.rows.length === 0)
      return res.status(404).json({ error: "Plato no encontrado" });

    // 2. Solo ahora se sube a Storage, ya confirmada la pertenencia
    const suffix   = lado === "b" ? "-menu-b" : "";
    const filename = `${negocioId}/${platoId}${suffix}-${req.file.safeName}`;

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

    const columna = lado === "b" ? "foto_menu_b" : "foto";
    await pool.query(
      `UPDATE platos SET ${columna} = $1 WHERE id = $2 AND negocio_id = $3`,
      [publicUrl, platoId, negocioId]
    );

    res.json({ url: publicUrl });
  } catch (err) {
    console.error("[subirFotoPlato]", err.message);
    res.status(500).json({ error: "Error al subir la foto del plato" });
  }
}

module.exports = { getPlatos, crearPlato, actualizarPlato, eliminarPlato, subirFotoPlato };