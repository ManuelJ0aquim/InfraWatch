"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("./redis");
const slaWorker_1 = require("../Workers/slaWorker");
exports.monitoringWorker = new bullmq_1.Worker('monitoring', async (job) => {
    const { serviceId } = job.data;
    const service = await slaWorker_1.prisma.service.findUnique({
        where: { id: serviceId },
        select: { name: true },
    });
    await (0, slaWorker_1.processSlaAndAlerts)(serviceId);
    return { serviceName: service?.name ?? serviceId };
}, { connection: redis_1.redisConnection, concurrency: 5 });
exports.monitoringWorker.on('completed', (job, result) => {
    console.log(`Job ${job.id} concluído para serviço ${result?.serviceName}`);
});
exports.monitoringWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} falhou para serviço ${job?.data?.serviceId}:`, err?.message);
});
