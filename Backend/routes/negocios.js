const express  = require("express");
const router   = express.Router();
const auth     = require("../middleware/auth");
const { getNegocios, getNegocioById, getCategorias } = require("../controllers/negociosController");
const { crearResena, getResenas }                    = require("../controllers/resenasController");

router.get("/categorias",    getCategorias);
router.get("/",              getNegocios);
router.get("/:id",           getNegocioById);
router.get("/:id/resenas",   getResenas);
router.post("/:id/resenas",  auth, crearResena);

module.exports = router;
