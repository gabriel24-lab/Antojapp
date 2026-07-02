const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const negocios = await prisma.negocios.findMany({
    orderBy: { id: 'desc' },
    take: 3,
    include: { sedes: true }
  });
  console.log(JSON.stringify(negocios, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
