"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertWindow = upsertWindow;
exports.getWindow = getWindow;
exports.listWindows = listWindows;
const prisma_1 = require("../utils/prisma");
async function upsertWindow(win) {
    const prisma = (0, prisma_1.getPrisma)();
    const existing = await prisma.slaWindow.findFirst({
        where: { serviceId: win.serviceId ?? undefined, systemId: win.systemId ?? undefined, periodStart: win.periodStart, periodEnd: win.periodEnd },
    });
    if (existing) {
        const updated = await prisma.slaWindow.update({ where: { id: existing.id }, data: { ...win, computedAt: new Date().toISOString() } });
        return updated;
    }
    const created = await prisma.slaWindow.create({ data: win });
    return created;
}
async function getWindow(serviceId, periodStart, periodEnd) {
    const prisma = (0, prisma_1.getPrisma)();
    return await prisma.slaWindow.findFirst({ where: { serviceId, periodStart, periodEnd } });
}
async function listWindows(serviceId, fromISO, toISO) {
    const prisma = (0, prisma_1.getPrisma)();
    return await prisma.slaWindow.findMany({
        where: { serviceId, OR: [{ periodStart: { gte: fromISO, lt: toISO } }, { periodEnd: { gt: fromISO, lte: toISO } }] },
        orderBy: { periodStart: "asc" }
    });
}
//# sourceMappingURL=windowRepo.js.map