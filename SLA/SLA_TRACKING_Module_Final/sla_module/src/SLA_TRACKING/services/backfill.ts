import { getWindow, upsertWindow } from "../repositories/windowRepo";
import { computeServiceWindow } from "./windowCalculator";
import { SlaPolicy } from "../domain/types";

export async function markWindowForRecompute(serviceId: string, fromISO: string, toISO: string) {
  const existing = await getWindow(serviceId, fromISO, toISO);
  if (existing) await upsertWindow({ ...existing, needsRecompute: true });
}
export async function recomputeWindow(serviceId: string, policy: SlaPolicy, fromISO: string, toISO: string) {
  return computeServiceWindow(serviceId, policy, fromISO, toISO);
}
