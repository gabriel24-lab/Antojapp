// Middleware factory: valida req.body contra un schema Zod.
// Uso: router.post("/ruta", validarBody(miSchema), controlador)

const { ZodError } = require("zod");

function validarBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const mensaje = result.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      return res.status(400).json({ error: mensaje });
    }
    // Reemplazar req.body con los datos ya validados/transformados por Zod
    req.body = result.data;
    next();
  };
}

module.exports = validarBody;
