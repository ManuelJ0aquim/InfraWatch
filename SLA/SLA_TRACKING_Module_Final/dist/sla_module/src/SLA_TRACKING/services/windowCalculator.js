"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeServiceWindow = computeServiceWindow;
const types_1 = require("../domain/types");
const incidentRepo_1 = require("../repositories/incidentRepo");
const maintenanceRepo_1 = require("../repositories/maintenanceRepo");
const windowRepo_1 = require("../repositories/windowRepo");
const time_1 = require("../utils/time");
const ranges_1 = require("../utils/ranges");
const violationRepo_1 = require("../repositories/violationRepo");
async function computeServiceWindow(serviceId, policy, periodStartISO, periodEndISO) {
    const [incidents, maints] = await Promise.all([
        (0, incidentRepo_1.listIncidentsForService)(serviceId, periodStartISO, periodEndISO),
        (0, maintenanceRepo_1.listMaintenancesForService)(serviceId, periodStartISO, periodEndISO),
    ]);
    const start = new Date(periodStartISO);
    const end = new Date(periodEndISO);
    let usedMs = 0;
    for (const inc of incidents) {
        const s = new Date(inc.startedAt);
        const e = new Date(inc.endedAt ?? new Date().toISOString());
        const cs = s < start ? start : s;
        const ce = e > end ? end : e;
        if (ce <= cs)
            continue;
        usedMs += (0, ranges_1.unplannedDowntimeMs)(cs, ce, maints);
    }
    const totalMs = (0, time_1.msBetween)(start, end);
    const allowedPct = policy.targetPct;
    const allowedMs = Math.max(0, Math.round(totalMs * (1 - allowedPct / 100)));
    const uptimePct = ((totalMs - usedMs) / totalMs) * 100;
    let status;
    if (usedMs >= allowedMs && allowedMs > 0)
        status = types_1.WindowStatus.BREACHED;
    else {
        const now = new Date();
        const elapsed = Math.max(1, (0, time_1.msBetween)(start, now < end ? now : end));
        const projectedUsed = usedMs + (usedMs / elapsed) * (totalMs - elapsed);
        if ((projectedUsed >= allowedMs && allowedMs > 0) || (allowedMs - usedMs) < allowedMs * 0.25)
            status = types_1.WindowStatus.AT_RISK;
        else
            status = types_1.WindowStatus.OK;
    }
    const windowRow = await (0, windowRepo_1.upsertWindow)({
        id: "",
        serviceId,
        systemId: null,
        periodStart: periodStartISO,
        periodEnd: periodEndISO,
        availabilityPct: Number(uptimePct.toFixed(4)),
        errorBudgetAllowedMs: allowedMs,
        errorBudgetUsedMs: usedMs,
        status,
        computedAt: new Date().toISOString(),
        needsRecompute: false,
    });
    // If the SLA window is breached, record a violation associated with the active policy.
    if (status === types_1.WindowStatus.BREACHED) {
        try {
            await (0, violationRepo_1.createViolationIfNotExists)(policy.id, windowRow.id, policy.targetPct, Number(uptimePct.toFixed(4)), null);
        }
        catch (err) {
            // swallow errors to avoid blocking SLA computation. Logging could be added here.
        }
    }
    return windowRow;
}
//# sourceMappingURL=windowCalculator.js.map