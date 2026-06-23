// Middleware: solo permite el paso si el usuario tiene rol 'negocio' o 'propietario'
function esNegocio(req, res, next) {
  const rolesPermitidos = ["negocio", "propietario"];
  if (!rolesPermitidos.includes(req.usuario?.rol)) {
    return res
      .status(403)
      .json({
        error: "Solo los propietarios de negocio pueden realizar esta acción",
      });
  }
  next();
}

module.exports = esNegocio;
