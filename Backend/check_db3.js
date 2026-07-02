const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const whereClause = {
    activo: true,
    estado: "aprobado",
  };

  const negocios = await prisma.negocios.findMany({
    where: whereClause,
    include: {
      sedes: true,
      propietario: { select: { nombre: true, foto_perfil: true } },
    },
    orderBy: { calificacion: "desc" },
  });

  console.log("Total found:", negocios.length);
  const found76 = negocios.find(n => n.id === 76);
  console.log("Is 76 found?", found76 ? "Yes" : "No");
  if(found76) {
    console.log("Business 76 name:", found76.nombre);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
