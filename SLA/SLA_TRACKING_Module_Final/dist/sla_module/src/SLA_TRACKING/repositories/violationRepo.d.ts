import { Violation } from "../domain/types";
export declare function createViolation(v: Omit<Violation, "id" | "createdAt">): Promise<Violation>;
export declare function listViolations(policyId: string, fromISO: string, toISO: string): Promise<Violation[]>;
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
export declare function createViolationIfNotExists(policyId: string, windowId: string, expectedPct: number, observedPct: number, reason?: string | null): Promise<Violation>;
//# sourceMappingURL=violationRepo.d.ts.map