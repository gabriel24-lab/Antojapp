const express    = require("express");
const router     = express.Router();
const auth       = require("../middleware/auth");
const { registro, login, me } = require("../controllers/authController");
const { googleLogin }         = require("../controllers/googleAuthController");

router.post("/registro",    registro);
router.post("/login",       login);
router.get("/me",           auth, me);
router.post("/google",      googleLogin);   // ← nuevo: recibe el id_token de GIS

module.exports = router;
