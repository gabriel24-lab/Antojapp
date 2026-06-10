// Middleware: solo permite el paso si el usuario tiene rol 'negocio'
function esNegocio(req, res, next) {
  if (req.usuario?.rol !== "negocio") {
    return res.status(403).json({ error: "Solo los propietarios de negocio pueden realizar esta acción" });
  }
  next();
}

module.exports = esNegocio;
