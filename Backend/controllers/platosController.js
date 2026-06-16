const prisma   = require("../db/pool");
const supabase = require("../db/supabase");
const { captureError } = require("../lib/sentry");

// GET /api/negocios/:id/platos  (público)
async function getPlatos(req, res) {
  const { id: negocioId } = req.params;

  try {
    const platos = await prisma.platos.findMany({
      where: { negocio_id: parseInt(negocioId) },
      include: {
        plato_descuentos: {
          select: { dia: true, precio_descuento: true, precio_desc: true }
        }
      },
      orderBy: [
        { tipo: 'asc' },
        { nombre: 'asc' }
      ]
    });

    const result = platos.map(p => {
      const descuentos = p.plato_descuentos.map(d => ({
        dia: d.dia,
        precio_descuento: d.precio_desc !== null ? d.precio_desc : d.precio_descuento,
        precio_desc: d.precio_desc
      }));
      delete p.plato_descuentos;
      return { ...p, descuentos };
    });

    res.json(result);
  } catch (err) {
    captureError(err, "[getPlatos]");
    res.status(500).json({ error: "Ups, algo salió mal. Estamos trabajando en ello, por favor intenta de nuevo más tarde." });
  }
}

// POST /api/negocios/:id/platos
async function crearPlato(req, res) {
  const { id: negocioId } = req.params;
  const { nombre, descripcion, tipo, precio, disponible = true, descuentos = [], foto_menu_b } = req.body;

  const esMenu = tipo?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === "menu";

  if (!nombre || !tipo)
    return res.status(400).json({ error: "nombre y tipo son obligatorios" });

  if (!esMenu && precio === undefined)
    return res.status(400).json({ error: "El precio es obligatorio para platos que no son menú" });

  if (tipo.length > 50)
    return res.status(400).json({ error: "El tipo no puede superar 50 caracteres" });

  try {
    const precioFinal = esMenu ? null : parseInt(precio);

    const plato = await prisma.platos.create({
      data: {
        negocio_id: parseInt(negocioId),
        nombre: nombre.trim(),
        descripcion: descripcion || "",
        tipo,
        precio: precioFinal,
        foto_menu_b: foto_menu_b || null,
        disponible,
        plato_descuentos: {
          create: descuentos.map(d => ({
            dia: d.dia,
            precio_descuento: d.precio_desc || 0,
            precio_desc: d.precio_desc
          }))
        }
      }
    });

    res.status(201).json(plato);
  } catch (err) {
    captureError(err, "[crearPlato]");
    res.status(500).json({ error: "Ups, algo salió mal. Estamos trabajando en ello, por favor intenta de nuevo más tarde." });
  }
}

// PUT /api/negocios/:id/platos/:platoId
async function actualizarPlato(req, res) {
  const { id: negocioId, platoId } = req.params;
  const { nombre, descripcion, tipo, precio, disponible, descuentos, foto_menu_b } = req.body;

  try {
    const transacciones = [];

    if (descuentos !== undefined) {
      transacciones.push(
        prisma.plato_descuentos.deleteMany({
          where: { plato_id: parseInt(platoId) }
        })
      );
    }

    const dataUpdate = {};
    if (nombre !== undefined) dataUpdate.nombre = nombre;
    if (descripcion !== undefined) dataUpdate.descripcion = descripcion;
    if (tipo !== undefined) dataUpdate.tipo = tipo;
    if (precio !== undefined) dataUpdate.precio = precio;
    if (disponible !== undefined) dataUpdate.disponible = disponible;
    if (foto_menu_b !== undefined) dataUpdate.foto_menu_b = foto_menu_b;

    if (descuentos !== undefined && descuentos.length > 0) {
      dataUpdate.plato_descuentos = {
        create: descuentos.map(d => ({
          dia: d.dia,
          precio_descuento: d.precio_desc || 0,
          precio_desc: d.precio_desc
        }))
      };
    }

    // Only add update transaction if there is something to update
    if (Object.keys(dataUpdate).length > 0) {
      transacciones.push(
        prisma.platos.update({
          where: { id: parseInt(platoId) },
          data: dataUpdate
        })
      );
    }

    if (transacciones.length === 0) {
        return res.json({});
    }

    const results = await prisma.$transaction(transacciones);
    const platoActualizado = results[results.length - 1];

    res.json(platoActualizado);
  } catch (err) {
    captureError(err, "[actualizarPlato]");
    if (err.code === 'P2025') {
        return res.status(404).json({ error: "Plato no encontrado" });
    }
    res.status(500).json({ error: "Ups, algo salió mal. Estamos trabajando en ello, por favor intenta de nuevo más tarde." });
  }
}

// DELETE /api/negocios/:id/platos/:platoId
async function eliminarPlato(req, res) {
  const { id: negocioId, platoId } = req.params;

  try {
    const plato = await prisma.platos.findUnique({
      where: { id: parseInt(platoId) },
      select: { foto: true, negocio_id: true }
    });

    if (!plato || plato.negocio_id !== parseInt(negocioId))
      return res.status(404).json({ error: "Plato no encontrado" });

    if (plato.foto) {
      const path = plato.foto.split("/platos/")[1];
      if (path) await supabase.storage.from("platos").remove([path]);
    }

    await prisma.platos.delete({
      where: { id: parseInt(platoId) }
    });

    res.json({ mensaje: "Plato eliminado" });
  } catch (err) {
    captureError(err, "[eliminarPlato]");
    res.status(500).json({ error: "Ups, algo salió mal. Estamos trabajando en ello, por favor intenta de nuevo más tarde." });
  }
}

// POST /api/negocios/:id/platos/:platoId/foto
async function subirFotoPlato(req, res) {
  const { id: negocioId, platoId } = req.params;
  const lado = req.query.lado === "b" ? "b" : "a";

  if (!req.file)
    return res.status(400).json({ error: "No se recibió ningún archivo" });

  try {
    const plato = await prisma.platos.findUnique({
      where: { id: parseInt(platoId) },
      select: { id: true, negocio_id: true }
    });

    if (!plato || plato.negocio_id !== parseInt(negocioId))
      return res.status(404).json({ error: "Plato no encontrado" });

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

    const dataUpdate = lado === "b" ? { foto_menu_b: publicUrl } : { foto: publicUrl };

    await prisma.platos.update({
      where: { id: parseInt(platoId) },
      data: dataUpdate
    });

    res.json({ url: publicUrl });
  } catch (err) {
    captureError(err, "[subirFotoPlato]");
    res.status(500).json({ error: "Error al subir la foto del plato" });
  }
}

module.exports = { getPlatos, crearPlato, actualizarPlato, eliminarPlato, subirFotoPlato };