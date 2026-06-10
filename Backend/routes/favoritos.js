const express  = require("express");
const router   = express.Router();
const auth     = require("../middleware/auth");
const { getFavoritos, agregarFavorito, quitarFavorito, getFavoritosIds } = require("../controllers/favoritosController");

// Todas las rutas de favoritos requieren estar autenticado
router.use(auth);

router.get("/",              getFavoritos);
router.get("/ids",           getFavoritosIds);
router.post("/:negocioId",   agregarFavorito);
router.delete("/:negocioId", quitarFavorito);

module.exports = router;
