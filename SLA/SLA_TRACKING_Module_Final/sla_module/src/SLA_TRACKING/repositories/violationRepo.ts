import { getPrisma } from "../utils/prisma";
import { Violation } from "../domain/types";

export async function createViolation(v: Omit<Violation, "id" | "createdAt">): Promise<Violation> {
  const prisma = getPrisma();
  return await prisma.slaViolation.create({ data: { ...v, createdAt: new Date().toISOString() } as any }) as any;
}
export async function listViolations(policyId: string, fromISO: string, toISO: string): Promise<Violation[]> {
  const prisma = getPrisma();
  return await prisma.slaViolation.findMany({ where: { policyId, createdAt: { gte: fromISO, lte: toISO } }, orderBy: { createdAt: "asc" } }) as any;
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
export async function createViolationIfNotExists(
  policyId: string,
  windowId: string,
  expectedPct: number,
  observedPct: number,
  reason?: string | null
): Promise<Violation> {
  const prisma = getPrisma();
  // Check whether a violation has already been recorded for this policy/window combination.
  const existing = await prisma.slaViolation.findFirst({ where: { policyId, windowId } });
  if (existing) return existing as any;
  return await prisma.slaViolation.create({
    data: {
      policyId,
      windowId,
      expectedPct,
      observedPct,
      reason: reason ?? null,
      createdAt: new Date().toISOString(),
    } as any,
  }) as any;
}
