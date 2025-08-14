"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rollupCurrentMonthForService = rollupCurrentMonthForService;
exports.rollupMonthForService = rollupMonthForService;
const policyRepo_1 = require("../repositories/policyRepo");
const time_1 = require("../utils/time");
const windowCalculator_1 = require("../services/windowCalculator");
const constants_1 = require("../domain/constants");
async function rollupCurrentMonthForService(serviceId) {
    const policy = await (0, policyRepo_1.getActivePolicyForService)(serviceId);
    if (!policy)
        return null;
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth() + 1;
    const start = (0, time_1.startOfMonthUTC)(y, m, policy.timezone || constants_1.DEFAULT_TIMEZONE);
    const end = (0, time_1.endOfMonthUTC)(y, m, policy.timezone || constants_1.DEFAULT_TIMEZONE);
    return await (0, windowCalculator_1.computeServiceWindow)(serviceId, policy, start.toISOString(), end.toISOString());
}
async function rollupMonthForService(serviceId, year, month1to12) {
    const policy = await (0, policyRepo_1.getActivePolicyForService)(serviceId);
    if (!policy)
        return null;
    const start = (0, time_1.startOfMonthUTC)(year, month1to12, policy.timezone || constants_1.DEFAULT_TIMEZONE);
    const end = (0, time_1.endOfMonthUTC)(year, month1to12, policy.timezone || constants_1.DEFAULT_TIMEZONE);
    return await (0, windowCalculator_1.computeServiceWindow)(serviceId, policy, start.toISOString(), end.toISOString());
}
//# sourceMappingURL=rollupWindow.job.js.map