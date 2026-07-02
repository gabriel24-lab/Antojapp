const prisma = require("../db/pool");

// Después de crear/editar/eliminar una sede, el negocio "cachea" la
// ubicación de su primera sede en negocios.pais/departamento/ciudad.
// Esto es solo para compatibilidad con el badge de país en las tarjetas
// y con búsquedas simples; el dato real (y el que se usa para filtrar
// correctamente negocios con sedes en varias ciudades) vive en "sedes".
async function sincronizarUbicacionNegocio(negocioId) {
  const primeraSede = await prisma.sedes.findFirst({
    where: { negocio_id: negocioId },
    orderBy: { id: "asc" },
  });

  await prisma.negocios.update({
    where: { id: negocioId },
    data: {
      pais: primeraSede?.pais || null,
      departamento: primeraSede?.departamento || null,
      ciudad: primeraSede?.ciudad || null,
    },
  });
}

module.exports = { sincronizarUbicacionNegocio };
