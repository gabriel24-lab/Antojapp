const prisma = require("../db/pool");
const { captureError } = require("../lib/sentry");

// ── Sedes ─────────────────────────────────────────────────────

// POST /api/negocios/:id/sedes
async function crearSede(req, res) {
  const { id: negocioId } = req.params;
  const {
    nombre,
    direccion,
    telefonos,
    lat,
    lng,
    horario,
    maps_url,
    referencia,
  } = req.body;

  if (!nombre)
    return res
      .status(400)
      .json({ error: "El nombre de la sede es obligatorio" });

  // Normalizar: acepta string o array, siempre guarda array
  const telArray = Array.isArray(telefonos)
    ? telefonos.filter(Boolean)
    : telefonos
      ? [telefonos]
      : [];

  try {
    const sede = await prisma.sedes.create({
      data: {
        negocio_id: parseInt(negocioId),
        nombre,
        direccion,
        telefonos: telArray,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        horario,
        maps_url,
        referencia,
      },
    });
    res.status(201).json(sede);
  } catch (err) {
    captureError(err, "[crearSede]");
    res.status(500).json({
      error:
        "Ups, algo salió mal. Estamos trabajando en ello, por favor intenta de nuevo más tarde.",
    });
  }
}

// PUT /api/negocios/:id/sedes/:sedeId
async function actualizarSede(req, res) {
  const { id: negocioId, sedeId } = req.params;
  const {
    nombre,
    direccion,
    telefonos,
    lat,
    lng,
    horario,
    maps_url,
    referencia,
  } = req.body;

  const telArray =
    telefonos !== undefined
      ? Array.isArray(telefonos)
        ? telefonos.filter(Boolean)
        : [telefonos].filter(Boolean)
      : undefined;

  const dataUpdate = {};
  if (nombre !== undefined) dataUpdate.nombre = nombre;
  if (direccion !== undefined) dataUpdate.direccion = direccion;
  if (telArray !== undefined) dataUpdate.telefonos = telArray;
  if (lat !== undefined) dataUpdate.lat = lat ? parseFloat(lat) : null;
  if (lng !== undefined) dataUpdate.lng = lng ? parseFloat(lng) : null;
  if (horario !== undefined) dataUpdate.horario = horario;
  if (maps_url !== undefined) dataUpdate.maps_url = maps_url;
  if (referencia !== undefined) dataUpdate.referencia = referencia;

  try {
    const sede = await prisma.sedes.findUnique({
      where: { id: parseInt(sedeId) },
    });
    if (!sede || sede.negocio_id !== parseInt(negocioId)) {
      return res.status(404).json({ error: "Sede no encontrada" });
    }

    const sedeActualizada = await prisma.sedes.update({
      where: { id: parseInt(sedeId) },
      data: dataUpdate,
    });

    res.json(sedeActualizada);
  } catch (err) {
    captureError(err, "[actualizarSede]");
    res.status(500).json({
      error:
        "Ups, algo salió mal. Estamos trabajando en ello, por favor intenta de nuevo más tarde.",
    });
  }
}

// DELETE /api/negocios/:id/sedes/:sedeId
async function eliminarSede(req, res) {
  const { id: negocioId, sedeId } = req.params;

  try {
    const sede = await prisma.sedes.findUnique({
      where: { id: parseInt(sedeId) },
    });
    if (!sede || sede.negocio_id !== parseInt(negocioId)) {
      return res.status(404).json({ error: "Sede no encontrada" });
    }

    await prisma.sedes.delete({
      where: { id: parseInt(sedeId) },
    });

    res.json({ mensaje: "Sede eliminada" });
  } catch (err) {
    captureError(err, "[eliminarSede]");
    res.status(500).json({
      error:
        "Ups, algo salió mal. Estamos trabajando en ello, por favor intenta de nuevo más tarde.",
    });
  }
}

module.exports = { crearSede, actualizarSede, eliminarSede };
