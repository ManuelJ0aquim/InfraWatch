"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listIncidentsForService = listIncidentsForService;
exports.createIncident = createIncident;
const prisma_1 = require("../utils/prisma");
async function listIncidentsForService(serviceId, fromISO, toISO) {
    const prisma = (0, prisma_1.getPrisma)();
    const rows = await prisma.incident.findMany({
        where: {
            serviceId,
            OR: [{ startedAt: { lt: toISO }, endedAt: { gt: fromISO } }, { startedAt: { gte: fromISO, lte: toISO } }]
        },
        orderBy: { startedAt: "asc" }
    });
    return rows;
}
async function createIncident(inc) {
    const prisma = (0, prisma_1.getPrisma)();
    return await prisma.incident.create({ data: { ...inc, createdAt: new Date().toISOString() } });
}
//# sourceMappingURL=incidentRepo.js.map