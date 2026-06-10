const express  = require("express");
const router   = express.Router();
const auth     = require("../middleware/auth");
const esNegocio = require("../middleware/esNegocio");
const { getEstadisticas } = require("../controllers/panelController");

// Todas las rutas del panel requieren auth + rol negocio
router.use(auth, esNegocio);

router.get("/estadisticas", getEstadisticas);

module.exports = router;
