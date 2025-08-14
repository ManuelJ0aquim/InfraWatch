import { getPrisma } from "../utils/prisma";
import { getActivePolicyForService } from "../repositories/policyRepo";
import { startOfMonthUTC, endOfMonthUTC } from "../utils/time";
import { computeServiceWindow } from "../services/windowCalculator";
import { DEFAULT_TIMEZONE } from "../domain/constants";

export async function rollupCurrentMonthForService(serviceId: string) {
  const policy = await getActivePolicyForService(serviceId);
  if (!policy) return null;
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const start = startOfMonthUTC(y, m, policy.timezone || DEFAULT_TIMEZONE);
  const end = endOfMonthUTC(y, m, policy.timezone || DEFAULT_TIMEZONE);
  return await computeServiceWindow(serviceId, policy, start.toISOString(), end.toISOString());
}

export async function rollupMonthForService(serviceId: string, year: number, month1to12: number) {
  const policy = await getActivePolicyForService(serviceId);
  if (!policy) return null;
  const start = startOfMonthUTC(year, month1to12, policy.timezone || DEFAULT_TIMEZONE);
  const end = endOfMonthUTC(year, month1to12, policy.timezone || DEFAULT_TIMEZONE);
  return await computeServiceWindow(serviceId, policy, start.toISOString(), end.toISOString());
}
