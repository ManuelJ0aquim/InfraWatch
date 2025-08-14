"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createViolation = createViolation;
exports.listViolations = listViolations;
exports.createViolationIfNotExists = createViolationIfNotExists;
const prisma_1 = require("../utils/prisma");
async function createViolation(v) {
    const prisma = (0, prisma_1.getPrisma)();
    return await prisma.slaViolation.create({ data: { ...v, createdAt: new Date().toISOString() } });
}
async function listViolations(policyId, fromISO, toISO) {
    const prisma = (0, prisma_1.getPrisma)();
    return await prisma.slaViolation.findMany({ where: { policyId, createdAt: { gte: fromISO, lte: toISO } }, orderBy: { createdAt: "asc" } });
}
/**
 * Create a violation if none exists for the given policy and window.  This helper ensures
 * that multiple recalculations of the same SLA window do not produce duplicate
 * violation records.  It checks for an existing violation with the same
 * policyId and windowId and only inserts a new record when none is found.
 *
 * @param policyId The UUID of the policy being violated.
 * @param windowId The UUID of the SLA window where the violation occurred.
 * @param expectedPct The target percentage defined by the policy.
 * @param observedPct The actual availability percentage observed for the window.
 * @param reason Optional free‑text reason for the violation.
 */
async function createViolationIfNotExists(policyId, windowId, expectedPct, observedPct, reason) {
    const prisma = (0, prisma_1.getPrisma)();
    // Check whether a violation has already been recorded for this policy/window combination.
    const existing = await prisma.slaViolation.findFirst({ where: { policyId, windowId } });
    if (existing)
        return existing;
    return await prisma.slaViolation.create({
        data: {
            policyId,
            windowId,
            expectedPct,
            observedPct,
            reason: reason ?? null,
            createdAt: new Date().toISOString(),
        },
    });
}
//# sourceMappingURL=violationRepo.js.map