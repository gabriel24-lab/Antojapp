const multer         = require("multer");
const { v4: uuidv4 } = require("uuid");

// Wrapper que añade req.file.safeExt (extensión derivada del MIME type real,
// nunca del nombre original) y req.file.safeName (UUID). Compartido entre
// rutas de negocios, platos y perfil de usuario.
function withSafeFilename(fieldName) {
  const mimeToExt = { "image/jpeg": "jpg", "image/png": "png" };
  return [
    multer({
      storage: multer.memoryStorage(),
      limits:  { fileSize: 2 * 1024 * 1024 }, // 2 MB máximo
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new Error("Solo se permiten imágenes"), false);
      },
    }).single(fieldName),
    (req, res, next) => {
      if (req.file) {
        req.file.safeExt  = mimeToExt[req.file.mimetype] || "jpg";
        req.file.safeName = `${uuidv4()}.${req.file.safeExt}`;
      }
      next();
    },
  ];
}

module.exports = { withSafeFilename };
