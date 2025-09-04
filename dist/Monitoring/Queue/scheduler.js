"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startQueueScheduler = startQueueScheduler;
const client_1 = require("@prisma/client");
const jobQueue_1 = require("./jobQueue");
const prisma = new client_1.PrismaClient();
async function startQueueScheduler() {
    console.log('Agendador de monitoramento iniciado...');
    await enqueueAll();
    setInterval(enqueueAll, 60 * 1000);
}
async function enqueueAll() {
    const services = await prisma.service.findMany({ select: { id: true } });
    await Promise.all(services.map(s => (0, jobQueue_1.enqueueServiceCheck)(s.id)));
}
