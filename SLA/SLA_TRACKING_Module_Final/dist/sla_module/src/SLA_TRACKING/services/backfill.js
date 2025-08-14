"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markWindowForRecompute = markWindowForRecompute;
exports.recomputeWindow = recomputeWindow;
const windowRepo_1 = require("../repositories/windowRepo");
const windowCalculator_1 = require("./windowCalculator");
async function markWindowForRecompute(serviceId, fromISO, toISO) {
    const existing = await (0, windowRepo_1.getWindow)(serviceId, fromISO, toISO);
    if (existing)
        await (0, windowRepo_1.upsertWindow)({ ...existing, needsRecompute: true });
}
async function recomputeWindow(serviceId, policy, fromISO, toISO) {
    return (0, windowCalculator_1.computeServiceWindow)(serviceId, policy, fromISO, toISO);
}
//# sourceMappingURL=backfill.js.map