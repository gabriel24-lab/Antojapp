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

const actualizarNegocioSchema = crearNegocioSchema.partial().extend({
  activo: z.boolean().optional(),
});

module.exports = { crearNegocioSchema, actualizarNegocioSchema };
