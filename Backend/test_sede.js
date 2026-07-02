const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sedeSchema } = require('./schemas/negocios.js');

async function main() {
  const payload = {
    nombre: "Principal",
    direccion: "Calle Falsa 123",
    pais: "CO",
    pais_nombre: "Colombia",
    ciudad: "Bogotá",
    telefonos: "",
    maps_url: ""
  };

  try {
    const valid = sedeSchema.parse(payload);
    console.log("Validation passed:", valid);
  } catch(e) {
    console.error("Validation failed:", e.errors);
  }
}

main().finally(() => prisma.$disconnect());
