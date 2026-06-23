const { Worker } = require("bullmq");
const prisma = require("../db/pool");
const IORedis = require("ioredis");

const dsnRedis = process.env.REDIS_URL;

if (!dsnRedis) {
  console.warn(
    "[Worker] REDIS_URL no definido. Worker de BullMQ desactivado para evitar errores de conexión.",
  );
  module.exports = null;
} else {
  const connection = new IORedis(dsnRedis, { maxRetriesPerRequest: null });

  connection.on("error", (err) => {
    if (err.code !== "ECONNREFUSED")
      console.error("[Redis Error Worker]", err.message);
  });

  const analyticsWorker = new Worker(
    "analyticsQueue",
    async (job) => {
      if (job.name === "registrarVisita") {
        const { negocioId } = job.data;
        if (negocioId) {
          await prisma.visitas.create({
            data: { negocio_id: parseInt(negocioId) },
          });
          console.log(`[Worker] Visita registrada para negocio ${negocioId}`);
        }
      }
    },
    { connection },
  );

  analyticsWorker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job.id} failed:`, err.message);
  });

  console.log("[Worker] analyticsWorker iniciado y escuchando...");
  module.exports = analyticsWorker;
}

// File ends here
