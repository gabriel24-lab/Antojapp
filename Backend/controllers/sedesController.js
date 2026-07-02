const prisma = require("../db/pool");
const { captureError } = require("../lib/sentry");
const { geocodificarDireccion } = require("../lib/geocoding");
const { sincronizarUbicacionNegocio } = require("../lib/sedesSync");

// ── Sedes ─────────────────────────────────────────────────────

// POST /api/negocios/:id/sedes
async function crearSede(req, res) {
  const { id: negocioId } = req.params;
  const {
    nombre,
    direccion,
    pais,
    pais_nombre,
    departamento,
    ciudad,
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

  let latFinal = lat ? parseFloat(lat) : null;
  let lngFinal = lng ? parseFloat(lng) : null;
  let mapsUrlFinal = maps_url?.trim() || null;

  // Si el propietario no tiene a la mano el link de Google Maps, pero sí
  // escribió la dirección, intentamos ubicarla solos (Nominatim/OSM).
  // Si no se encuentra o el servicio falla, seguimos sin bloquear el guardado:
  // la sede queda sin maps_url y el propietario puede agregarlo después.
  if (!mapsUrlFinal && direccion) {
    const geo = await geocodificarDireccion({
      direccion,
      ciudad,
      departamento,
      paisIso2: pais,
      paisNombre: pais_nombre,
    });
    if (geo) {
      latFinal = geo.lat;
      lngFinal = geo.lng;
      mapsUrlFinal = geo.maps_url;
    }
  }

  try {
    const sede = await prisma.sedes.create({
      data: {
        negocio_id: parseInt(negocioId),
        nombre,
        direccion,
        pais: pais || null,
        pais_nombre: pais_nombre || null,
        departamento: departamento || null,
        ciudad: ciudad || null,
        telefonos: telArray,
        lat: latFinal,
        lng: lngFinal,
        horario,
        maps_url: mapsUrlFinal,
        referencia,
      },
    });

    await sincronizarUbicacionNegocio(parseInt(negocioId));

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
    pais,
    pais_nombre,
    departamento,
    ciudad,
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

  try {
    const sede = await prisma.sedes.findUnique({
      where: { id: parseInt(sedeId) },
    });
    if (!sede || sede.negocio_id !== parseInt(negocioId)) {
      return res.status(404).json({ error: "Sede no encontrada" });
    }

    const dataUpdate = {};
    if (nombre !== undefined) dataUpdate.nombre = nombre;
    if (direccion !== undefined) dataUpdate.direccion = direccion;
    if (pais !== undefined) dataUpdate.pais = pais || null;
    if (pais_nombre !== undefined) dataUpdate.pais_nombre = pais_nombre || null;
    if (departamento !== undefined)
      dataUpdate.departamento = departamento || null;
    if (ciudad !== undefined) dataUpdate.ciudad = ciudad || null;
    if (telArray !== undefined) dataUpdate.telefonos = telArray;
    if (lat !== undefined) dataUpdate.lat = lat ? parseFloat(lat) : null;
    if (lng !== undefined) dataUpdate.lng = lng ? parseFloat(lng) : null;
    if (horario !== undefined) dataUpdate.horario = horario;
    if (maps_url !== undefined)
      dataUpdate.maps_url = maps_url?.trim() || null;
    if (referencia !== undefined) dataUpdate.referencia = referencia;

    // ¿Cambió la dirección (o la ubicación) y no nos dieron un link nuevo?
    // Intentamos re-geocodificar solos, igual que al crear la sede.
    const direccionCambio =
      direccion !== undefined || ciudad !== undefined || pais !== undefined;
    const sinMapsUrlNuevo = !dataUpdate.maps_url;

    if (direccionCambio && sinMapsUrlNuevo) {
      const direccionFinal = direccion !== undefined ? direccion : sede.direccion;
      const ciudadFinal = ciudad !== undefined ? ciudad : sede.ciudad;
      const departamentoFinal =
        departamento !== undefined ? departamento : sede.departamento;
      const paisFinal = pais !== undefined ? pais : sede.pais;
      const paisNombreFinal =
        pais_nombre !== undefined ? pais_nombre : sede.pais_nombre;

      const geo = await geocodificarDireccion({
        direccion: direccionFinal,
        ciudad: ciudadFinal,
        departamento: departamentoFinal,
        paisIso2: paisFinal,
        paisNombre: paisNombreFinal,
      });
      if (geo) {
        dataUpdate.lat = geo.lat;
        dataUpdate.lng = geo.lng;
        dataUpdate.maps_url = geo.maps_url;
      }
    }

    const sedeActualizada = await prisma.sedes.update({
      where: { id: parseInt(sedeId) },
      data: dataUpdate,
    });

    await sincronizarUbicacionNegocio(parseInt(negocioId));

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

    await sincronizarUbicacionNegocio(parseInt(negocioId));

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
