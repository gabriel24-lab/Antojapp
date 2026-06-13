const express    = require("express");
const router     = express.Router();
const auth       = require("../middleware/auth");
const validarBody             = require("../middleware/validarBody");
const { registroSchema, loginSchema } = require("../schemas/auth");
const { registro, login, me, logout } = require("../controllers/authController");
const { googleLogin }                 = require("../controllers/googleAuthController");

router.post("/registro",    validarBody(registroSchema), registro);
router.post("/login",       validarBody(loginSchema),    login);
router.get( "/me",          auth, me);
router.post("/logout",      logout);        // limpia cookie HttpOnly
router.post("/google",      googleLogin);

module.exports = router;
