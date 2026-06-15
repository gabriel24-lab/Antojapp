const { Worker } = require("bullmq");
const prisma = require("../db/pool");

const connection = {
  host: "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
};

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
