const { z } = require("zod");

// maps_url: opcional. Si viene, debe ser una URL válida; pero también
// aceptamos "" (string vacío) para que el frontend no tenga que mandar
// null y podamos distinguir "no lo llenó" de "lo borró a propósito".
const mapsUrlField = z
  .union([z.string().url().max(500), z.literal("")])
  .optional()
  .nullable();

const sedeSchema = z
  .object({
    nombre: z.string().min(1).max(150).trim(),
    direccion: z.string().max(255).optional().nullable(),
    // Ubicación de la sede (mundial y obligatoria: cada sede puede estar
    // en un país/ciudad distinto, no se puede asumir la de otra sede).
    // país = código ISO2 (ej: "CO").
    pais: z.string().length(2, "Selecciona un país"),
    pais_nombre: z.string().max(100).optional().nullable(),
    departamento: z.string().max(100).optional().nullable(),
    ciudad: z.string().min(1, "Selecciona una ciudad").max(100),
    telefonos: z
      .union([z.array(z.string().max(20)), z.string().max(20)])
      .optional(),
    lat: z.number().optional().nullable(),
    lng: z.number().optional().nullable(),
    horario: z.record(z.string()).optional(),
    maps_url: mapsUrlField,
    referencia: z.string().max(255).optional().nullable(),
  })
  // El propietario debe dar AL MENOS una forma de ubicar la sede en el mapa:
  // la dirección en texto (que luego intentamos geocodificar solos) o,
  // si no la tiene automatizable, el link de Google Maps directamente.
  .refine((s) => !!s.direccion?.trim() || !!s.maps_url?.trim(), {
    message: "Indica la dirección de la sede o un link de Google Maps",
    path: ["direccion"],
  });

const crearNegocioSchema = z.object({
  nombre: z.string().min(1).max(150).trim(),
  categoria: z.string().min(1).max(100),
  descripcion: z.string().max(2000).optional().default(""),
  etiquetas: z.array(z.string().max(50)).max(10).optional().default([]),
  maps_url: z.string().url().max(500).optional().nullable(),
  whatsapp: z.string().max(30).optional().nullable(),
  instagram: z.string().max(100).optional().nullable(),
  sedes: z.array(sedeSchema).max(20).optional().default([]),
});

// NOTA DE SEGURIDAD: "activo" y "estado" NO son editables por el propietario.
// Solo el panel de administración (esAdmin -> actualizarEstadoNegocio) puede
// cambiar estos campos, ya que controlan la visibilidad pública del negocio
// y forman parte del flujo de moderación. Si en el futuro se necesita exponer
// alguno de estos campos al propietario, debe hacerse en un endpoint
// independiente protegido por esAdmin, nunca aquí.
const actualizarNegocioSchema = crearNegocioSchema.partial();

// Las rutas POST/PUT /negocios/:id/sedes usan este mismo schema completo:
// el frontend siempre envía el objeto de sede entero (no parches parciales),
// así que no hace falta una versión ".partial()" para actualizar.
module.exports = {
  crearNegocioSchema,
  actualizarNegocioSchema,
  sedeSchema,
};
