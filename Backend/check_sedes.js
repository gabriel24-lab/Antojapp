const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sedes = await prisma.sedes.findMany({ where: { negocio_id: 76 } });
  console.log("Sedes of 76:", JSON.stringify(sedes, null, 2));
}

main().finally(() => prisma.$disconnect());
