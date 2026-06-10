const pool     = require("../db/pool");
const supabase = require("../db/supabase");

// ── Lectura pública ────────────────────────────────────────────

// GET /api/negocios
async function getNegocios(req, res) {
  const { busqueda, categoria, soloAbiertos } = req.query;

  try {
    let query = `
      SELECT
        n.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', s.id,
              'nombre', s.nombre,
              'direccion', s.direccion,
              'telefonos', s.telefonos,
              'lat', s.lat,
              'lng', s.lng,
              'horario', s.horario
            )
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) AS sedes
      FROM negocios n
      LEFT JOIN sedes s ON s.negocio_id = n.id
      WHERE n.activo = TRUE
    `;

    const condiciones = [];
    const valores     = [];

    if (categoria && categoria !== "Todas") {
      valores.push(categoria);
      condiciones.push(`n.categoria = $${valores.length}`);
    }

    if (busqueda && busqueda.trim()) {
      valores.push(`%${busqueda.toLowerCase()}%`);
      const i = valores.length;
      condiciones.push(`(
        LOWER(n.nombre)       LIKE $${i} OR
        LOWER(n.descripcion)  LIKE $${i} OR
        LOWER(n.categoria)    LIKE $${i} OR
        EXISTS (
          SELECT 1 FROM unnest(n.etiquetas) tag
          WHERE LOWER(tag) LIKE $${i}
        )
      )`);
    }

    if (condiciones.length > 0)
      query += " AND " + condiciones.join(" AND ");

    query += " GROUP BY n.id ORDER BY n.calificacion DESC";

    const result = await pool.query(query, valores);
    let negocios = result.rows.map(formatearNegocio);

    if (soloAbiertos === "true") {
      negocios = negocios.filter(n => estaAbierto(n.sedes));
    }

    res.json(negocios);
  } catch (err) {
    console.error("Error en getNegocios:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// GET /api/negocios/:id
async function getNegocioById(req, res) {
  const { id } = req.params;

  try {
    const negocio = await pool.query(
      "SELECT * FROM negocios WHERE id = $1 AND activo = TRUE",
      [id]
    );
    if (negocio.rows.length === 0)
      return res.status(404).json({ error: "Negocio no encontrado" });

    const sedes = await pool.query(
      "SELECT * FROM sedes WHERE negocio_id = $1 ORDER BY id",
      [id]
    );

    const resenas = await pool.query(
      "SELECT * FROM resenas WHERE negocio_id = $1 ORDER BY creado_en DESC",
      [id]
    );

    const platos = await pool.query(
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
      [id]
    );

    // Registrar visita (sin bloquear la respuesta)
    pool.query(
      "INSERT INTO visitas (negocio_id) VALUES ($1)",
      [id]
    ).catch(e => console.error("Error registrando visita:", e));

    res.json({
      ...formatearNegocio({
        ...negocio.rows[0],
        sedes:   sedes.rows,
        resenas: resenas.rows,
      }),
      platos: platos.rows,
    });
  } catch (err) {
    console.error("Error en getNegocioById:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// GET /api/negocios/categorias
async function getCategorias(req, res) {
  try {
    const result = await pool.query(
      "SELECT DISTINCT categoria FROM negocios WHERE activo = TRUE ORDER BY categoria"
    );
    res.json(result.rows.map(r => r.categoria));
  } catch (err) {
    console.error("Error en getCategorias:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// ── Escritura (propietario) ────────────────────────────────────

// POST /api/negocios  — crear negocio
async function crearNegocio(req, res) {
  const propietarioId = req.usuario.id;
  const {
    nombre, categoria, descripcion, etiquetas,
    maps_url, whatsapp, instagram,
    sedes = [],
  } = req.body;

  if (!nombre || !categoria)
    return res.status(400).json({ error: "Nombre y categoría son obligatorios" });

  try {
    // Verificar que el usuario no tenga ya un negocio registrado
    const existe = await pool.query(
      "SELECT id FROM negocios WHERE propietario_id = $1",
      [propietarioId]
    );
    if (existe.rows.length > 0)
      return res.status(409).json({
        error: "Ya tienes un negocio registrado. Edítalo desde tu panel.",
        negocio_id: existe.rows[0].id,
      });

    const result = await pool.query(
      `INSERT INTO negocios
         (propietario_id, nombre, categoria, descripcion, etiquetas, maps_url, whatsapp, instagram, activo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, TRUE)
       RETURNING *`,
      [
        propietarioId,
        nombre.trim(),
        categoria,
        descripcion?.trim() || "",
        etiquetas || [],
        maps_url  || null,
        whatsapp  || null,
        instagram || null,
      ]
    );

    const negocio = result.rows[0];

    // Crear sedes si vienen en el body
    if (sedes.length > 0) {
      const sedePromises = sedes.map(s =>
        pool.query(
          `INSERT INTO sedes (negocio_id, nombre, direccion, telefonos, lat, lng, horario, maps_url, referencia)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [negocio.id, s.nombre, s.direccion, Array.isArray(s.telefonos) ? s.telefonos : (s.telefonos ? [s.telefonos] : []), s.lat, s.lng, s.horario, s.maps_url, s.referencia]
        )
      );
      await Promise.all(sedePromises);
    }

    res.status(201).json(negocio);
  } catch (err) {
    console.error("Error en crearNegocio:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// PUT /api/negocios/:id  — editar negocio (solo propietario)
async function actualizarNegocio(req, res) {
  const { id } = req.params;
  const {
    nombre, categoria, descripcion, etiquetas,
    maps_url, whatsapp, instagram, activo,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE negocios
       SET
         nombre      = COALESCE($1, nombre),
         categoria   = COALESCE($2, categoria),
         descripcion = COALESCE($3, descripcion),
         etiquetas   = COALESCE($4, etiquetas),
         maps_url    = COALESCE($5, maps_url),
         whatsapp    = COALESCE($6, whatsapp),
         instagram   = COALESCE($7, instagram),
         activo      = COALESCE($8, activo)
       WHERE id = $9
       RETURNING *`,
      [nombre, categoria, descripcion, etiquetas, maps_url, whatsapp, instagram, activo, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error en actualizarNegocio:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// POST /api/negocios/:id/imagen  — subir icono o foto de portada
// Body: multipart/form-data con campo 'imagen' (archivo) y 'tipo' ("icono" | "portada")
async function subirImagen(req, res) {
  const { id }  = req.params;
  const { tipo } = req.body; // "icono" | "portada"

  if (!req.file)
    return res.status(400).json({ error: "No se recibió ningún archivo" });

  if (!["icono", "portada"].includes(tipo))
    return res.status(400).json({ error: "tipo debe ser 'icono' o 'portada'" });

  try {
    const ext      = req.file.originalname.split(".").pop();
    const filename = `${id}/${tipo}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("negocios")
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert:      true,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("negocios")
      .getPublicUrl(filename);

    // Guardar la URL en la columna correspondiente
    const columna = tipo === "icono" ? "icono" : "portada";
    await pool.query(
      `UPDATE negocios SET ${columna} = $1 WHERE id = $2`,
      [publicUrl, id]
    );

    res.json({ url: publicUrl });
  } catch (err) {
    console.error("Error en subirImagen:", err);
    res.status(500).json({ error: "Error al subir la imagen" });
  }
}

// POST /api/negocios/:id/fotos  — agregar foto al array fotos[]
async function subirFoto(req, res) {
  const { id } = req.params;

  if (!req.file)
    return res.status(400).json({ error: "No se recibió ningún archivo" });

  try {
    const ext      = req.file.originalname.split(".").pop();
    const filename = `${id}/fotos/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("negocios")
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert:      false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("negocios")
      .getPublicUrl(filename);

    // Agregar al array fotos[]
    await pool.query(
      "UPDATE negocios SET fotos = array_append(fotos, $1) WHERE id = $2",
      [publicUrl, id]
    );

    res.json({ url: publicUrl });
  } catch (err) {
    console.error("Error en subirFoto:", err);
    res.status(500).json({ error: "Error al subir la foto" });
  }
}

// DELETE /api/negocios/:id/fotos  — eliminar una foto del array
async function eliminarFoto(req, res) {
  const { id }  = req.params;
  const { url } = req.body;

  if (!url)
    return res.status(400).json({ error: "URL de la foto es obligatoria" });

  try {
    // Extraer el path relativo dentro del bucket
    const path = url.split("/negocios/")[1];

    await supabase.storage.from("negocios").remove([path]);

    await pool.query(
      "UPDATE negocios SET fotos = array_remove(fotos, $1) WHERE id = $2",
      [url, id]
    );

    res.json({ mensaje: "Foto eliminada" });
  } catch (err) {
    console.error("Error en eliminarFoto:", err);
    res.status(500).json({ error: "Error al eliminar la foto" });
  }
}

// GET /api/negocios/mio  — negocio del propietario autenticado
async function getMiNegocio(req, res) {
  const propietarioId = req.usuario.id;

  try {
    const negocio = await pool.query(
      "SELECT * FROM negocios WHERE propietario_id = $1",
      [propietarioId]
    );

    if (negocio.rows.length === 0)
      return res.status(404).json({ error: "No tienes ningún negocio registrado" });

    const id = negocio.rows[0].id;

    const [sedes, platos] = await Promise.all([
      pool.query("SELECT * FROM sedes WHERE negocio_id = $1 ORDER BY id", [id]),
      pool.query(
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
         GROUP BY p.id ORDER BY p.tipo, p.nombre`,
        [id]
      ),
    ]);

    res.json({
      ...formatearNegocio({ ...negocio.rows[0], sedes: sedes.rows }),
      platos: platos.rows,
    });
  } catch (err) {
    console.error("Error en getMiNegocio:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// ── Helpers ───────────────────────────────────────────────────

function formatearNegocio(n) {
  return {
    ...n,
    totalResenas: n.total_resenas,
    abierto: estaAbierto(n.sedes || []),
  };
}

const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

function estaAbierto(sedes) {
  if (!sedes || sedes.length === 0) return false;
  const ahora  = new Date();
  const diaNom = DIAS[ahora.getDay()];
  const actual = ahora.getHours() * 60 + ahora.getMinutes();

  return sedes.some(sede => {
    const horaDia = sede.horario?.[diaNom];
    if (!horaDia || horaDia === "cerrado") return false;
    const [apertura, cierre] = horaDia.split("-");
    const [ha, ma] = apertura.split(":").map(Number);
    const [hc, mc] = cierre.split(":").map(Number);
    return actual >= ha * 60 + ma && actual < hc * 60 + mc;
  });
}

module.exports = {
  getNegocios,
  getNegocioById,
  getCategorias,
  crearNegocio,
  actualizarNegocio,
  subirImagen,
  subirFoto,
  eliminarFoto,
  getMiNegocio,
};