"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAlertingCycle = runAlertingCycle;
const prisma_1 = require("../utils/prisma");
async function runAlertingCycle() {
    const prisma = (0, prisma_1.getPrisma)();
    const nowISO = new Date().toISOString();
    const atRisk = await prisma.slaWindow.findMany({ where: { status: "AT_RISK" } });
    const breached = await prisma.slaWindow.findMany({ where: { status: "BREACHED" } });
    if (atRisk.length)
        console.log(`[SLA_ALERT][AT_RISK] count=${atRisk.length} at ${nowISO}`);
    if (breached.length)
        console.log(`[SLA_ALERT][BREACHED] count=${breached.length} at ${nowISO}`);
    // Integrate here with your NotificationController
}
//# sourceMappingURL=alerting.job.js.map