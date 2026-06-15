const pool     = require("../db/pool");
const supabase = require("../db/supabase");

const LIMITE_NEGOCIOS = 4;

// ── Lectura pública ────────────────────────────────────────────

// GET /api/negocios
async function getNegocios(req, res) {
  const { busqueda, categoria, soloAbiertos, pais, departamento, ciudad } = req.query;

  try {
    let query = `
      SELECT
        n.id, n.nombre, n.categoria, n.descripcion, n.portada, n.icono,
        n.fotos, n.calificacion, n.total_resenas, n.etiquetas,
        n.maps_url, n.whatsapp, n.instagram, n.activo,
        n.pais, n.ciudad, n.moneda, n.creado_en,
        u.nombre AS propietario_nombre, u.foto_perfil AS propietario_foto,
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
      LEFT JOIN usuarios u ON n.propietario_id = u.id
      WHERE n.activo = TRUE AND n.estado = 'aprobado'
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

    if (pais && pais.trim()) {
      valores.push(pais.trim().toUpperCase());
      condiciones.push(`n.pais = $${valores.length}`);
    }

    if (departamento && departamento.trim()) {
      valores.push(departamento.trim());
      condiciones.push(`LOWER(n.departamento) = LOWER($${valores.length})`);
    }

    if (ciudad && ciudad.trim()) {
      valores.push(ciudad.trim());
      condiciones.push(`LOWER(n.ciudad) = LOWER($${valores.length})`);
    }

    if (condiciones.length > 0)
      query += " AND " + condiciones.join(" AND ");

    query += " GROUP BY n.id, u.nombre, u.foto_perfil ORDER BY n.calificacion DESC";

    const result = await pool.query(query, valores);
    let negocios = result.rows.map(formatearNegocio);

    if (soloAbiertos === "true") {
      negocios = negocios.filter(n => estaAbierto(n.sedes));
    }

    res.json(negocios);
  } catch (err) {
    console.error("[getNegocios]", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// GET /api/negocios/:id
async function getNegocioById(req, res) {
  const { id } = req.params;

  try {
    const negocio = await pool.query(
      `SELECT n.id, n.nombre, n.categoria, n.descripcion, n.portada, n.icono,
              n.fotos, n.calificacion, n.total_resenas, n.etiquetas,
              n.maps_url, n.whatsapp, n.instagram, n.activo,
              n.pais, n.ciudad, n.moneda, n.creado_en,
              u.nombre AS propietario_nombre, u.foto_perfil AS propietario_foto
       FROM negocios n
       LEFT JOIN usuarios u ON n.propietario_id = u.id
       WHERE n.id = $1 AND n.activo = TRUE AND n.estado = 'aprobado'`,
      [id]
    );
    if (negocio.rows.length === 0)
      return res.status(404).json({ error: "Negocio no encontrado" });

    const sedes = await pool.query(
      "SELECT * FROM sedes WHERE negocio_id = $1 ORDER BY id",
      [id]
    );

    // SEGURIDAD: no incluir usuario_id — evita enumeración de IDs de usuario
    // a través de las reseñas públicas.
    const resenas = await pool.query(
      `SELECT id, negocio_id, usuario_nombre, estrellas, comentario, creado_en
       FROM resenas WHERE negocio_id = $1 ORDER BY creado_en DESC`,
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
    ).catch(e => console.error("[registrarVisita]", e.message));

    res.json({
      ...formatearNegocio({
        ...negocio.rows[0],
        sedes:   sedes.rows,
        resenas: resenas.rows,
      }),
      platos: platos.rows,
    });
  } catch (err) {
    console.error("[getNegocioById]", err.message);
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
    console.error("[getCategorias]", err.message);
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
    // Verificar que el propietario no haya alcanzado el límite de negocios
    const existentes = await pool.query(
      "SELECT id FROM negocios WHERE propietario_id = $1",
      [propietarioId]
    );
    if (existentes.rows.length >= LIMITE_NEGOCIOS)
      return res.status(409).json({
        error: `Has alcanzado el límite de ${LIMITE_NEGOCIOS} negocios registrados.`,
        limite: LIMITE_NEGOCIOS,
        total: existentes.rows.length,
      });

    const result = await pool.query(
      `INSERT INTO negocios
         (propietario_id, nombre, categoria, descripcion, etiquetas, maps_url, whatsapp, instagram, activo, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, FALSE, 'pendiente')
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
    console.error("[crearNegocio]", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// PUT /api/negocios/:id  — editar negocio (solo propietario)
// SEGURIDAD: "activo" y "estado" se excluyen deliberadamente. Estos campos
// controlan la visibilidad pública y solo deben cambiar vía el panel de
// administración (actualizarEstadoNegocio, protegido por esAdmin).
async function actualizarNegocio(req, res) {
  const { id } = req.params;
  const {
    nombre, categoria, descripcion, etiquetas,
    maps_url, whatsapp, instagram,
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
         instagram   = COALESCE($7, instagram)
       WHERE id = $8
       RETURNING *`,
      [nombre, categoria, descripcion, etiquetas, maps_url, whatsapp, instagram, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("[actualizarNegocio]", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// POST /api/negocios/:id/imagen  — subir icono o foto de portada
async function subirImagen(req, res) {
  const { id }  = req.params;
  const { tipo } = req.body;

  if (!req.file)
    return res.status(400).json({ error: "No se recibió ningún archivo" });

  if (!["icono", "portada"].includes(tipo))
    return res.status(400).json({ error: "tipo debe ser 'icono' o 'portada'" });

  try {
    // Use safeName (UUID.ext) set by the route middleware — never trust originalname
    const filename = `${id}/${tipo}-${req.file.safeName}`;

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

    const columna = tipo === "icono" ? "icono" : "portada";
    await pool.query(
      `UPDATE negocios SET ${columna} = $1 WHERE id = $2`,
      [publicUrl, id]
    );

    res.json({ url: publicUrl });
  } catch (err) {
    console.error("[subirImagen]", err.message);
    res.status(500).json({ error: "Error al subir la imagen" });
  }
}

// POST /api/negocios/:id/fotos  — agregar foto al array fotos[]
async function subirFoto(req, res) {
  const { id } = req.params;

  if (!req.file)
    return res.status(400).json({ error: "No se recibió ningún archivo" });

  try {
    const filename = `${id}/fotos/${req.file.safeName}`;

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

    await pool.query(
      "UPDATE negocios SET fotos = array_append(fotos, $1) WHERE id = $2",
      [publicUrl, id]
    );

    res.json({ url: publicUrl });
  } catch (err) {
    console.error("[subirFoto]", err.message);
    res.status(500).json({ error: "Error al subir la foto" });
  }
}

// DELETE /api/negocios/:id/fotos  — eliminar una foto del array
// SEGURIDAD: se verifica que `url` exista en el array `fotos` del negocio
// :id ANTES de borrar del Storage. Sin esto, un propietario autenticado
// podría borrar archivos del bucket de OTRO negocio enviando su URL.
async function eliminarFoto(req, res) {
  const { id }  = req.params;
  const { url } = req.body;

  if (!url)
    return res.status(400).json({ error: "URL de la foto es obligatoria" });

  try {
    // 1. Verificar pertenencia ANTES de tocar Storage
    const negocio = await pool.query(
      "SELECT 1 FROM negocios WHERE id = $1 AND $2 = ANY(fotos)",
      [id, url]
    );

    if (negocio.rows.length === 0)
      return res.status(404).json({ error: "La foto no pertenece a este negocio" });

    // 2. Solo ahora se borra del Storage, ya confirmada la pertenencia
    const path = url.split("/negocios/")[1];
    await supabase.storage.from("negocios").remove([path]);
    await pool.query(
      "UPDATE negocios SET fotos = array_remove(fotos, $1) WHERE id = $2",
      [url, id]
    );
    res.json({ mensaje: "Foto eliminada" });
  } catch (err) {
    console.error("[eliminarFoto]", err.message);
    res.status(500).json({ error: "Error al eliminar la foto" });
  }
}

// GET /api/negocios/mio/negocio  — todos los negocios del propietario autenticado
async function getMiNegocio(req, res) {
  const propietarioId = req.usuario.id;

  try {
    const negociosResult = await pool.query(
      "SELECT * FROM negocios WHERE propietario_id = $1 ORDER BY id",
      [propietarioId]
    );

    if (negociosResult.rows.length === 0)
      return res.status(404).json({ error: "No tienes ningún negocio registrado" });

    // Cargar sedes y platos de todos los negocios en paralelo
    const negociosCompletos = await Promise.all(
      negociosResult.rows.map(async (negocio) => {
        const [sedes, platos] = await Promise.all([
          pool.query("SELECT * FROM sedes WHERE negocio_id = $1 ORDER BY id", [negocio.id]),
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
            [negocio.id]
          ),
        ]);
        return {
          ...formatearNegocio({ ...negocio, sedes: sedes.rows }),
          platos: platos.rows,
        };
      })
    );

    // Mantener compatibilidad: si solo hay 1 negocio, devolver el formato original
    // Además incluir el array completo y el total para que el frontend pueda mostrar el límite
    res.json({
      negocio:   negociosCompletos[0],   // primer negocio (compatibilidad con PanelPropietario)
      negocios:  negociosCompletos,      // todos los negocios
      total:     negociosCompletos.length,
      limite:    LIMITE_NEGOCIOS,
    });
  } catch (err) {
    console.error("[getMiNegocio]", err.message);
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