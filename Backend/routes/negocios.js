const express        = require("express");
const multer         = require("multer");
const router         = express.Router();

const auth           = require("../middleware/auth");
const esNegocio      = require("../middleware/esNegocio");
const esPropietario  = require("../middleware/esPropietario");
const validarImagen  = require("../middleware/validarImagen");

const {
  getNegocios, getNegocioById, getCategorias,
  crearNegocio, actualizarNegocio,
  subirImagen, subirFoto, eliminarFoto,
  getMiNegocio,
} = require("../controllers/negociosController");

const { crearResena, getResenas }                            = require("../controllers/resenasController");
const { crearSede, actualizarSede, eliminarSede }            = require("../controllers/sedesController");
const { getPlatos, crearPlato, actualizarPlato, eliminarPlato, subirFotoPlato } = require("../controllers/platosController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Solo se permiten imágenes"), false);
  },
});

// ── Rutas públicas ─────────────────────────────────────────────
router.get("/categorias",  getCategorias);
router.get("/",            getNegocios);

// ── Rutas del propietario ──────────────────────────────────────
router.get("/mio/negocio",                    auth, esNegocio,                getMiNegocio);

router.get("/:id",         getNegocioById);
router.get("/:id/platos",  getPlatos);
router.get("/:id/resenas", getResenas);

router.post("/",                              auth, esNegocio,                crearNegocio);
router.put( "/:id",                           auth, esNegocio, esPropietario, actualizarNegocio);

// Imágenes — validarImagen se aplica DESPUÉS de multer
router.post("/:id/imagen", auth, esNegocio, esPropietario, upload.single("imagen"), validarImagen, subirImagen);
router.post("/:id/fotos",  auth, esNegocio, esPropietario, upload.single("foto"),   validarImagen, subirFoto);
router.delete("/:id/fotos",auth, esNegocio, esPropietario, eliminarFoto);

// Sedes
router.post(  "/:id/sedes",           auth, esNegocio, esPropietario, crearSede);
router.put(   "/:id/sedes/:sedeId",   auth, esNegocio, esPropietario, actualizarSede);
router.delete("/:id/sedes/:sedeId",   auth, esNegocio, esPropietario, eliminarSede);

// Platos
router.post(  "/:id/platos",                  auth, esNegocio, esPropietario, crearPlato);
router.put(   "/:id/platos/:platoId",         auth, esNegocio, esPropietario, actualizarPlato);
router.delete("/:id/platos/:platoId",         auth, esNegocio, esPropietario, eliminarPlato);
router.post(  "/:id/platos/:platoId/foto",    auth, esNegocio, esPropietario, upload.single("foto"), validarImagen, subirFotoPlato);

// Reseñas
router.post("/:id/resenas", auth, crearResena);

module.exports = router;
