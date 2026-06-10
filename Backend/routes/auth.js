const express    = require("express");
const router     = express.Router();
const auth       = require("../middleware/auth");
const { registro, login, me } = require("../controllers/authController");

router.post("/registro", registro);
router.post("/login",    login);
router.get("/me",        auth, me);

module.exports = router;
