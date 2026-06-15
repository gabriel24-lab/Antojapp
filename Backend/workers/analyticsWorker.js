const { Worker } = require("bullmq");
const prisma = require("../db/pool");
const IORedis = require("ioredis");

const dsnRedis = process.env.REDIS_URL;

if (!dsnRedis && process.env.NODE_ENV === "production") {
  console.warn("[Worker] REDIS_URL no definido. Worker de BullMQ desactivado en producción para evitar errores de conexión.");
  module.exports = null;
  // Retornamos sin inicializar para evitar el spam de ioredis reconnects
} else {
  const connection = dsnRedis 
    ? new IORedis(dsnRedis, { maxRetriesPerRequest: null })
    : new IORedis({ host: "127.0.0.1", port: process.env.REDIS_PORT || 6379, maxRetriesPerRequest: null });

  connection.on("error", (err) => {
    if (err.code !== "ECONNREFUSED") console.error("[Redis Error Worker]", err.message);
  });

  const analyticsWorker = new Worker('analyticsQueue', async job => {
    if (job.name === 'registrarVisita') {
      const { negocioId } = job.data;
      if (negocioId) {
        await prisma.visitas.create({
          data: { negocio_id: parseInt(negocioId) }
        });
        console.log(`[Worker] Visita registrada para negocio ${negocioId}`);
      }
    }
  }, { connection });

  analyticsWorker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job.id} failed:`, err.message);
  });

  console.log("[Worker] analyticsWorker iniciado y escuchando...");
  module.exports = analyticsWorker;
}

// File ends here
