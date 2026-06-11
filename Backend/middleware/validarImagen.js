// Middleware: valida que el archivo subido sea una imagen real
// (verifica MIME type Y extensión del nombre de archivo)

const EXTENSIONES_VALIDAS = ["jpg", "jpeg", "png", "webp", "gif"];
const MIME_TYPES_VALIDOS  = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function validarImagen(req, res, next) {
  if (!req.file) return next(); // multer ya rechazó si no hay archivo

  const ext = req.file.originalname.split(".").pop().toLowerCase();

  if (!EXTENSIONES_VALIDAS.includes(ext))
    return res.status(400).json({ error: `Extensión no permitida. Usa: ${EXTENSIONES_VALIDAS.join(", ")}` });

  if (!MIME_TYPES_VALIDOS.includes(req.file.mimetype))
    return res.status(400).json({ error: "Tipo de archivo no permitido" });

  next();
}

module.exports = validarImagen;
