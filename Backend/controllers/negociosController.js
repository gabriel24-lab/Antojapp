const prisma   = require("../db/pool");
const supabase = require("../db/supabase");
const { captureError } = require("../lib/sentry");

// Para Tip 8: BullMQ
const { Queue } = require("bullmq");
const IORedis = require("ioredis");

let analyticsQueue = null;

const dsnRedis = process.env.REDIS_URL;
// Solo levantar la cola si existe Redis, para evitar spam de ECONNREFUSED en producción
if (dsnRedis || process.env.NODE_ENV !== "production") {
  const connection = dsnRedis 
    ? new IORedis(dsnRedis, { maxRetriesPerRequest: null })
    : new IORedis({ host: "127.0.0.1", port: process.env.REDIS_PORT || 6379, maxRetriesPerRequest: null });

  connection.on("error", (err) => {
    if (err.code !== "ECONNREFUSED") console.error("[Redis Error Queue]", err.message);
  });

  analyticsQueue = new Queue('analyticsQueue', { connection });
}

const LIMITE_NEGOCIOS = 4;

// GET /api/negocios
async function getNegocios(req, res) {
  const { busqueda, categoria, soloAbiertos, pais, departamento, ciudad } = req.query;

  try {
    const whereClause = {
      activo: true,
      estado: 'aprobado'
    };

    if (categoria && categoria !== "Todas") {
      whereClause.categoria = categoria;
    }

    if (busqueda && busqueda.trim()) {
      const search = busqueda.toLowerCase();
      whereClause.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
        { categoria: { contains: search, mode: 'insensitive' } },
        { etiquetas: { has: search } }
      ];
    }

    if (pais && pais.trim()) {
      whereClause.pais = pais.trim().toUpperCase();
    }
    if (departamento && departamento.trim()) {
      whereClause.departamento = { equals: departamento.trim(), mode: 'insensitive' };
    }
    if (ciudad && ciudad.trim()) {
      whereClause.ciudad = { equals: ciudad.trim(), mode: 'insensitive' };
    }

    const negocios = await prisma.negocios.findMany({
      where: whereClause,
      include: {
        sedes: true,
        propietario: { select: { nombre: true, foto_perfil: true } }
      },
      orderBy: { calificacion: 'desc' }
    });

    let negociosMapeados = negocios.map(formatearNegocio);

    if (soloAbiertos === "true") {
      negociosMapeados = negociosMapeados.filter(n => estaAbierto(n.sedes));
    }

    res.json(negociosMapeados);
  } catch (err) {
    captureError(err, "[getNegocios]");
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// GET /api/negocios/:id
async function getNegocioById(req, res) {
  const { id } = req.params;

  try {
    const negocio = await prisma.negocios.findFirst({
      where: {
        id: parseInt(id),
        activo: true,
        estado: 'aprobado'
      },
      include: {
        propietario: { select: { nombre: true, foto_perfil: true } },
        sedes: { orderBy: { id: 'asc' } },
        resenas: {
          select: { id: true, negocio_id: true, usuario_nombre: true, estrellas: true, comentario: true, creado_en: true },
          orderBy: { creado_en: 'desc' }
        },
        platos: {
          include: {
            plato_descuentos: {
              select: { dia: true, precio_descuento: true, precio_desc: true }
            }
          },
          orderBy: [
            { tipo: 'asc' },
            { nombre: 'asc' }
          ]
        }
      }
    });

    if (!negocio)
      return res.status(404).json({ error: "Negocio no encontrado" });

    // Procesar platos
    const platosMapped = negocio.platos.map(p => {
      const descuentos = p.plato_descuentos.map(d => ({
        dia: d.dia,
        precio_descuento: d.precio_desc !== null ? d.precio_desc : d.precio_descuento
      }));
      delete p.plato_descuentos;
      return { ...p, descuentos };
    });

    // Registrar visita en background (Job Queue Tip 8)
    if (analyticsQueue) {
      analyticsQueue.add("registrarVisita", { negocioId: parseInt(id) })
        .catch(e => captureError(e, "[BullMQ registrarVisita]"));
    }

    const result = formatearNegocio(negocio);
    const { platos, ...resto } = result;

    res.json({
      ...resto,
      platos: platosMapped
    });
  } catch (err) {
    captureError(err, "[getNegocioById]");
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// GET /api/negocios/categorias
async function getCategorias(req, res) {
  try {
    const categorias = await prisma.negocios.findMany({
      where: { activo: true },
      distinct: ['categoria'],
      select: { categoria: true },
      orderBy: { categoria: 'asc' }
    });
    res.json(categorias.map(c => c.categoria));
  } catch (err) {
    captureError(err, "[getCategorias]");
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// POST /api/negocios
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
    const totalExistentes = await prisma.negocios.count({
      where: { propietario_id: propietarioId }
    });

    if (totalExistentes >= LIMITE_NEGOCIOS)
      return res.status(409).json({
        error: `Has alcanzado el límite de ${LIMITE_NEGOCIOS} negocios registrados.`,
        limite: LIMITE_NEGOCIOS,
        total: totalExistentes,
      });

    const sedesData = sedes.map(s => ({
      nombre: s.nombre,
      direccion: s.direccion,
      telefonos: Array.isArray(s.telefonos) ? s.telefonos : (s.telefonos ? [s.telefonos] : []),
      lat: s.lat ? parseFloat(s.lat) : null,
      lng: s.lng ? parseFloat(s.lng) : null,
      horario: s.horario,
      maps_url: s.maps_url,
      referencia: s.referencia
    }));

    const negocio = await prisma.negocios.create({
      data: {
        propietario_id: propietarioId,
        nombre: nombre.trim(),
        categoria,
        descripcion: descripcion?.trim() || "",
        etiquetas: etiquetas || [],
        maps_url: maps_url || null,
        whatsapp: whatsapp || null,
        instagram: instagram || null,
        activo: false,
        estado: 'pendiente',
        sedes: {
          create: sedesData
        }
      }
    });

    res.status(201).json(negocio);
  } catch (err) {
    if (err.code === 'P2002') {
        return res.status(409).json({ error: "Ya existe un negocio con ese nombre y categoría" });
    }
    captureError(err, "[crearNegocio]");
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// PUT /api/negocios/:id
async function actualizarNegocio(req, res) {
  const { id } = req.params;
  const {
    nombre, categoria, descripcion, etiquetas,
    maps_url, whatsapp, instagram,
  } = req.body;

  try {
    const dataUpdate = {};
    if (nombre !== undefined) dataUpdate.nombre = nombre;
    if (categoria !== undefined) dataUpdate.categoria = categoria;
    if (descripcion !== undefined) dataUpdate.descripcion = descripcion;
    if (etiquetas !== undefined) dataUpdate.etiquetas = etiquetas;
    if (maps_url !== undefined) dataUpdate.maps_url = maps_url;
    if (whatsapp !== undefined) dataUpdate.whatsapp = whatsapp;
    if (instagram !== undefined) dataUpdate.instagram = instagram;

    const negocio = await prisma.negocios.update({
      where: { id: parseInt(id) },
      data: dataUpdate
    });

    res.json(negocio);
  } catch (err) {
    captureError(err, "[actualizarNegocio]");
    if (err.code === 'P2025') {
        return res.status(404).json({ error: "Negocio no encontrado" });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// POST /api/negocios/:id/imagen
async function subirImagen(req, res) {
  const { id }  = req.params;
  const { tipo } = req.body;

  if (!req.file)
    return res.status(400).json({ error: "No se recibió ningún archivo" });

  if (!["icono", "portada"].includes(tipo))
    return res.status(400).json({ error: "tipo debe ser 'icono' o 'portada'" });

  try {
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

    const dataUpdate = tipo === "icono" ? { icono: publicUrl } : { portada: publicUrl };

    await prisma.negocios.update({
      where: { id: parseInt(id) },
      data: dataUpdate
    });

    res.json({ url: publicUrl });
  } catch (err) {
    captureError(err, "[subirImagen]");
    res.status(500).json({ error: "Error al subir la imagen" });
  }
}

// POST /api/negocios/:id/fotos
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

    await prisma.negocios.update({
      where: { id: parseInt(id) },
      data: {
        fotos: { push: publicUrl }
      }
    });

    res.json({ url: publicUrl });
  } catch (err) {
    captureError(err, "[subirFoto]");
    res.status(500).json({ error: "Error al subir la foto" });
  }
}

// DELETE /api/negocios/:id/fotos
async function eliminarFoto(req, res) {
  const { id }  = req.params;
  const { url } = req.body;

  if (!url)
    return res.status(400).json({ error: "URL de la foto es obligatoria" });

  try {
    const negocio = await prisma.negocios.findUnique({
      where: { id: parseInt(id) },
      select: { fotos: true }
    });

    if (!negocio || !negocio.fotos.includes(url))
      return res.status(404).json({ error: "La foto no pertenece a este negocio" });

    const path = url.split("/negocios/")[1];
    await supabase.storage.from("negocios").remove([path]);
    
    const nuevasFotos = negocio.fotos.filter(f => f !== url);

    await prisma.negocios.update({
      where: { id: parseInt(id) },
      data: { fotos: nuevasFotos }
    });

    res.json({ mensaje: "Foto eliminada" });
  } catch (err) {
    captureError(err, "[eliminarFoto]");
    res.status(500).json({ error: "Error al eliminar la foto" });
  }
}

// GET /api/negocios/mio/negocio
async function getMiNegocio(req, res) {
  const propietarioId = req.usuario.id;

  try {
    const negocios = await prisma.negocios.findMany({
      where: { propietario_id: propietarioId },
      orderBy: { id: 'asc' },
      include: {
        sedes: { orderBy: { id: 'asc' } },
        platos: {
          include: {
            plato_descuentos: {
              select: { dia: true, precio_descuento: true, precio_desc: true }
            }
          },
          orderBy: [
            { tipo: 'asc' },
            { nombre: 'asc' }
          ]
        }
      }
    });

    if (negocios.length === 0)
      return res.status(404).json({ error: "No tienes ningún negocio registrado" });

    const negociosCompletos = negocios.map(negocio => {
      const platosMapped = negocio.platos.map(p => {
        const descuentos = p.plato_descuentos.map(d => ({
          dia: d.dia,
          precio_descuento: d.precio_desc !== null ? d.precio_desc : d.precio_descuento
        }));
        delete p.plato_descuentos;
        return { ...p, descuentos };
      });
      
      const formated = formatearNegocio(negocio);
      delete formated.platos;

      return {
        ...formated,
        platos: platosMapped
      };
    });

    res.json({
      negocio:   negociosCompletos[0],
      negocios:  negociosCompletos,
      total:     negociosCompletos.length,
      limite:    LIMITE_NEGOCIOS,
    });
  } catch (err) {
    captureError(err, "[getMiNegocio]");
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// ── Helpers ───────────────────────────────────────────────────

function formatearNegocio(n) {
  const { propietario, ...resto } = n;
  return {
    ...resto,
    propietario_nombre: propietario?.nombre,
    propietario_foto: propietario?.foto_perfil,
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
  analyticsQueue
};