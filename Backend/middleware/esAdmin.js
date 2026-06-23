// Middleware: verifica que el usuario autenticado tenga rol 'admin'
function esAdmin(req, res, next) {
  if (req.usuario?.rol !== "admin")
    return res
      .status(403)
      .json({ error: "Acceso restringido a administradores" });
  next();
}

module.exports = esAdmin;
