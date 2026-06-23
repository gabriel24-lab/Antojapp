const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const esNegocio = require("../middleware/esNegocio");
const esAdmin = require("../middleware/esAdmin");
const {
  getEstadisticas,
  getAdminNegocios,
  actualizarEstadoNegocio,
} = require("../controllers/panelController");

// Panel del propietario
router.get("/estadisticas", auth, esNegocio, getEstadisticas);

// Panel de administración — verificación de negocios
router.get("/admin/negocios", auth, esAdmin, getAdminNegocios);
router.patch(
  "/admin/negocios/:id/estado",
  auth,
  esAdmin,
  actualizarEstadoNegocio,
);

module.exports = router;
