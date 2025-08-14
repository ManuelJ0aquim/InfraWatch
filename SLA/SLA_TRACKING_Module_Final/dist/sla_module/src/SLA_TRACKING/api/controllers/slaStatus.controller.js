"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSlaStatus = getSlaStatus;
const policyRepo_1 = require("../../repositories/policyRepo");
const time_1 = require("../../utils/time");
const windowCalculator_1 = require("../../services/windowCalculator");
const constants_1 = require("../../domain/constants");
async function getSlaStatus(req, reply) {
    const { id } = req.params;
    const { period } = req.query;
    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
        return reply.status(400).send({ error: "Query param 'period' must be YYYY-MM" });
    }
    const [year, month] = period.split("-").map((x) => parseInt(x, 10));
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return reply.status(400).send({ error: "Invalid year or month in period" });
    }
    const policy = await (0, policyRepo_1.getActivePolicyForService)(id);
    if (!policy)
        return reply.status(404).send({ error: "No active SLA policy for service" });
    const start = (0, time_1.startOfMonthUTC)(year, month, policy.timezone || constants_1.DEFAULT_TIMEZONE);
    const end = (0, time_1.endOfMonthUTC)(year, month, policy.timezone || constants_1.DEFAULT_TIMEZONE);
    const win = await (0, windowCalculator_1.computeServiceWindow)(id, policy, start.toISOString(), end.toISOString());
    return reply.send({
        window: {
            periodStart: win.periodStart,
            periodEnd: win.periodEnd,
            availabilityPct: win.availabilityPct,
            errorBudget: {
                allowedMs: win.errorBudgetAllowedMs,
                usedMs: win.errorBudgetUsedMs,
                remainingMs: Math.max(0, win.errorBudgetAllowedMs - win.errorBudgetUsedMs),
            },
            status: win.status,
            computedAt: win.computedAt,
        }
    });
}
//# sourceMappingURL=slaStatus.controller.js.map