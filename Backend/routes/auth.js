const express    = require("express");
const router     = express.Router();
const auth       = require("../middleware/auth");
const validarBody              = require("../middleware/validarBody");
const validarImagen             = require("../middleware/validarImagen");
const { withSafeFilename }      = require("../middleware/upload");
const { registroSchema, loginSchema, actualizarPerfilSchema, passwordSchema } = require("../schemas/auth");
const { registro, login, me, logout, actualizarPerfil, cambiarPassword, subirFotoPerfil } = require("../controllers/authController");
const { googleLogin }                 = require("../controllers/googleAuthController");
const { loginPorCuentaLimiter, uploadLimiter } = require("../middleware/rateLimiters");

router.post("/registro",    validarBody(registroSchema), registro);
// loginPorCuentaLimiter va ANTES de validarBody: si el email es inválido,
// Zod lo rechazará después, pero igual queremos contar el intento por IP
// (fallback del keyGenerator) para no perder visibilidad de abuso.
router.post("/login",       loginPorCuentaLimiter, validarBody(loginSchema), login);
router.get( "/me",          auth, me);
router.post("/logout",      auth, logout); // limpia cookie HttpOnly y revoca sesiones (token_version++)
router.post("/google",      googleLogin);

// ── Perfil ───────────────────────────────────────────────────
router.put( "/perfil",   auth, validarBody(actualizarPerfilSchema), actualizarPerfil);
router.put( "/password", auth, validarBody(passwordSchema),         cambiarPassword);
router.post("/foto",     auth, uploadLimiter, ...withSafeFilename("foto"), validarImagen, subirFotoPerfil);

module.exports = router;