const express        = require("express");
const multer         = require("multer");
const { v4: uuidv4 } = require("uuid");
const router         = express.Router();

const auth           = require("../middleware/auth");
const esNegocio      = require("../middleware/esNegocio");
const esPropietario  = require("../middleware/esPropietario");
const validarImagen  = require("../middleware/validarImagen");
const validarBody    = require("../middleware/validarBody");
const { crearNegocioSchema, actualizarNegocioSchema } = require("../schemas/negocios");

const {
  getNegocios, getNegocioById, getCategorias,
  crearNegocio, actualizarNegocio,
  subirImagen, subirFoto, eliminarFoto,
  getMiNegocio,
} = require("../controllers/negociosController");

const { crearResena, getResenas }                            = require("../controllers/resenasController");
const { crearSede, actualizarSede, eliminarSede }            = require("../controllers/sedesController");
const { getPlatos, crearPlato, actualizarPlato, eliminarPlato, subirFotoPlato } = require("../controllers/platosController");

// ── Multer: límite 2 MB, nombre de archivo completamente nuevo (UUID) ──
// El nombre original del atacante se descarta por completo aquí;
// negociosController.js usa req.file.safeExt para construir el path final.
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 2 * 1024 * 1024 }, // 2 MB máximo
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Solo se permiten imágenes"), false);
  },
}).single; // se usa como upload.single("campo") — ver rutas abajo

// Wrapper que añade req.file.safeExt (extensión derivada del MIME type real,
// nunca del nombre original) y req.file.safeName (UUID).
function withSafeFilename(fieldName) {
  const mimeToExt = { "image/jpeg": "jpg", "image/png": "png" };
  return [
    multer({
      storage: multer.memoryStorage(),
      limits:  { fileSize: 2 * 1024 * 1024 },
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

// ── Rutas públicas ─────────────────────────────────────────────
router.get("/categorias",  getCategorias);
router.get("/",            getNegocios);

// ── Rutas del propietario ──────────────────────────────────────
router.get("/mio/negocio",  auth, esNegocio, getMiNegocio);

router.get("/:id",          getNegocioById);
router.get("/:id/platos",   getPlatos);
router.get("/:id/resenas",  getResenas);

router.post("/",            auth, esNegocio,                validarBody(crearNegocioSchema),      crearNegocio);
router.put( "/:id",         auth, esNegocio, esPropietario, validarBody(actualizarNegocioSchema), actualizarNegocio);

// Imágenes — validarImagen se aplica DESPUÉS de multer
router.post("/:id/imagen",  auth, esNegocio, esPropietario, ...withSafeFilename("imagen"), validarImagen, subirImagen);
router.post("/:id/fotos",   auth, esNegocio, esPropietario, ...withSafeFilename("foto"),   validarImagen, subirFoto);
router.delete("/:id/fotos", auth, esNegocio, esPropietario, eliminarFoto);

// Sedes
router.post(  "/:id/sedes",         auth, esNegocio, esPropietario, crearSede);
router.put(   "/:id/sedes/:sedeId", auth, esNegocio, esPropietario, actualizarSede);
router.delete("/:id/sedes/:sedeId", auth, esNegocio, esPropietario, eliminarSede);

// Platos
router.post(  "/:id/platos",                auth, esNegocio, esPropietario, crearPlato);
router.put(   "/:id/platos/:platoId",       auth, esNegocio, esPropietario, actualizarPlato);
router.delete("/:id/platos/:platoId",       auth, esNegocio, esPropietario, eliminarPlato);
router.post(  "/:id/platos/:platoId/foto",  auth, esNegocio, esPropietario, ...withSafeFilename("foto"), validarImagen, subirFotoPlato);

// Reseñas
router.post("/:id/resenas", auth, crearResena);

module.exports = router;
