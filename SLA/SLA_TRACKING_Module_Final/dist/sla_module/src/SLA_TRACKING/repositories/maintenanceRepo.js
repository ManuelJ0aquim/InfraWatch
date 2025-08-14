"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMaintenancesForService = listMaintenancesForService;
exports.createMaintenance = createMaintenance;
const prisma_1 = require("../utils/prisma");
async function listMaintenancesForService(serviceId, fromISO, toISO) {
    const prisma = (0, prisma_1.getPrisma)();
    const rows = await prisma.maintenanceWindow.findMany({
        where: { serviceId, startsAt: { lt: toISO }, endsAt: { gt: fromISO } },
        orderBy: { startsAt: "asc" }
    });
    return rows;
}
async function createMaintenance(mw) {
    const prisma = (0, prisma_1.getPrisma)();
    return await prisma.maintenanceWindow.create({ data: mw });
}
//# sourceMappingURL=maintenanceRepo.js.map