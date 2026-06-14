const { z } = require("zod");

const sedeSchema = z.object({
  nombre:     z.string().min(1).max(150).trim(),
  direccion:  z.string().max(255).optional(),
  telefonos:  z.union([z.array(z.string().max(20)), z.string().max(20)]).optional(),
  lat:        z.number().optional(),
  lng:        z.number().optional(),
  horario:    z.record(z.string()).optional(),
  maps_url:   z.string().url().max(500).optional().nullable(),
  referencia: z.string().max(255).optional(),
});

const crearNegocioSchema = z.object({
  nombre:      z.string().min(1).max(150).trim(),
  categoria:   z.string().min(1).max(100),
  descripcion: z.string().max(2000).optional().default(""),
  etiquetas:   z.array(z.string().max(50)).max(10).optional().default([]),
  maps_url:    z.string().url().max(500).optional().nullable(),
  whatsapp:    z.string().max(30).optional().nullable(),
  instagram:   z.string().max(100).optional().nullable(),
  sedes:       z.array(sedeSchema).max(20).optional().default([]),
});

// NOTA DE SEGURIDAD: "activo" y "estado" NO son editables por el propietario.
// Solo el panel de administración (esAdmin -> actualizarEstadoNegocio) puede
// cambiar estos campos, ya que controlan la visibilidad pública del negocio
// y forman parte del flujo de moderación. Si en el futuro se necesita exponer
// alguno de estos campos al propietario, debe hacerse en un endpoint
// independiente protegido por esAdmin, nunca aquí.
const actualizarNegocioSchema = crearNegocioSchema.partial();

module.exports = { crearNegocioSchema, actualizarNegocioSchema };