const { z } = require("zod");

const registroSchema = z.object({
  nombre:   z.string().min(1).max(100).trim(),
  email:    z.string().email().max(254).toLowerCase(),
  password: z.string().min(8).max(128),
  rol:      z.enum(["usuario", "negocio", "propietario"]).optional().default("usuario"),
});

const loginSchema = z.object({
  email:    z.string().email().max(254),
  password: z.string().min(1).max(128),
});

module.exports = { registroSchema, loginSchema };
