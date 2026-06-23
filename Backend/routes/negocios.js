const express = require("express");
const multer = require("multer");
const router = express.Router();

const auth = require("../middleware/auth");
const esNegocio = require("../middleware/esNegocio");
const esPropietario = require("../middleware/esPropietario");
const validarImagen = require("../middleware/validarImagen");
const validarBody = require("../middleware/validarBody");
const { withSafeFilename } = require("../middleware/upload");
const {
  crearNegocioSchema,
  actualizarNegocioSchema,
} = require("../schemas/negocios");

const {
  getNegocios,
  getNegocioById,
  getCategorias,
  crearNegocio,
  actualizarNegocio,
  subirImagen,
  subirFoto,
  eliminarFoto,
  getMiNegocio,
} = require("../controllers/negociosController");

const { crearResena, getResenas } = require("../controllers/resenasController");
const {
  crearSede,
  actualizarSede,
  eliminarSede,
} = require("../controllers/sedesController");
const {
  getPlatos,
  crearPlato,
  actualizarPlato,
  eliminarPlato,
  subirFotoPlato,
} = require("../controllers/platosController");

const {
  uploadLimiter,
  resenaLimiter,
  escrituraNegocioLimiter,
} = require("../middleware/rateLimiters");

// ── Multer: límite 2 MB, nombre de archivo completamente nuevo (UUID) ──
// El nombre original del atacante se descarta por completo aquí;
// negociosController.js usa req.file.safeExt para construir el path final.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB máximo
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Solo se permiten imágenes"), false);
  },
}).single; // se usa como upload.single("campo") — ver rutas abajo

// ── Rutas públicas ─────────────────────────────────────────────
router.get("/categorias", getCategorias);
router.get("/", getNegocios);

// ── Rutas del propietario ──────────────────────────────────────
router.get("/mio/negocio", auth, esNegocio, getMiNegocio);

router.get("/:id", getNegocioById);
router.get("/:id/platos", getPlatos);
router.get("/:id/resenas", getResenas);

router.post(
  "/",
  auth,
  esNegocio,
  escrituraNegocioLimiter,
  validarBody(crearNegocioSchema),
  crearNegocio,
);
router.put(
  "/:id",
  auth,
  esNegocio,
  esPropietario,
  escrituraNegocioLimiter,
  validarBody(actualizarNegocioSchema),
  actualizarNegocio,
);

// Imágenes — validarImagen se aplica DESPUÉS de multer.
// uploadLimiter va ANTES de multer para rechazar temprano sin gastar I/O
// parseando el archivo si el usuario ya superó su cuota horaria.
router.post(
  "/:id/imagen",
  auth,
  esNegocio,
  esPropietario,
  uploadLimiter,
  ...withSafeFilename("imagen"),
  validarImagen,
  subirImagen,
);
router.post(
  "/:id/fotos",
  auth,
  esNegocio,
  esPropietario,
  uploadLimiter,
  ...withSafeFilename("foto"),
  validarImagen,
  subirFoto,
);
router.delete("/:id/fotos", auth, esNegocio, esPropietario, eliminarFoto);

// Sedes
router.post(
  "/:id/sedes",
  auth,
  esNegocio,
  esPropietario,
  escrituraNegocioLimiter,
  crearSede,
);
router.put(
  "/:id/sedes/:sedeId",
  auth,
  esNegocio,
  esPropietario,
  escrituraNegocioLimiter,
  actualizarSede,
);
router.delete(
  "/:id/sedes/:sedeId",
  auth,
  esNegocio,
  esPropietario,
  eliminarSede,
);

// Platos
router.post(
  "/:id/platos",
  auth,
  esNegocio,
  esPropietario,
  escrituraNegocioLimiter,
  crearPlato,
);
router.put(
  "/:id/platos/:platoId",
  auth,
  esNegocio,
  esPropietario,
  escrituraNegocioLimiter,
  actualizarPlato,
);
router.delete(
  "/:id/platos/:platoId",
  auth,
  esNegocio,
  esPropietario,
  eliminarPlato,
);
router.post(
  "/:id/platos/:platoId/foto",
  auth,
  esNegocio,
  esPropietario,
  uploadLimiter,
  ...withSafeFilename("foto"),
  validarImagen,
  subirFotoPlato,
);

// Reseñas
router.post("/:id/resenas", auth, resenaLimiter, crearResena);

module.exports = router;
