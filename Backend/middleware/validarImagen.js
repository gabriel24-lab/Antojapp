// Middleware: valida que el archivo subido sea una imagen real
// 1. Solo acepta JPEG y PNG (eliminados webp y gif)
// 2. Verifica extensión + MIME type declarado
// 3. Verifica magic bytes reales del buffer (no se fía del Content-Type del cliente)

const EXTENSIONES_VALIDAS = ["jpg", "jpeg", "png"];
const MIME_TYPES_VALIDOS  = ["image/jpeg", "image/png"];

// Magic bytes de cada formato permitido
const MAGIC_BYTES = [
  { mime: "image/jpeg", bytes: [0xFF, 0xD8, 0xFF] },
  { mime: "image/png",  bytes: [0x89, 0x50, 0x4E, 0x47] },
];

function validarMagicBytes(buffer) {
  return MAGIC_BYTES.some(({ bytes }) =>
    bytes.every((byte, i) => buffer[i] === byte)
  );
}

function validarImagen(req, res, next) {
  if (!req.file) return next(); // multer ya rechazó si no hay archivo

  const ext = req.file.originalname.split(".").pop().toLowerCase();

  if (!EXTENSIONES_VALIDAS.includes(ext))
    return res.status(400).json({ error: `Extensión no permitida. Usa: ${EXTENSIONES_VALIDAS.join(", ")}` });

  if (!MIME_TYPES_VALIDOS.includes(req.file.mimetype))
    return res.status(400).json({ error: "Tipo de archivo no permitido" });

  // Verificar magic bytes reales — un atacante puede mentir en Content-Type
  if (!req.file.buffer || req.file.buffer.length < 4)
    return res.status(400).json({ error: "Archivo demasiado pequeño o corrupto" });

  if (!validarMagicBytes(req.file.buffer))
    return res.status(400).json({ error: "El contenido del archivo no corresponde a una imagen JPEG o PNG" });

  next();
}

module.exports = validarImagen;
