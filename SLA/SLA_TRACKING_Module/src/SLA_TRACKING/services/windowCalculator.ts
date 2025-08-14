import { SlaPolicy, WindowStatus } from "../domain/types";
import { listIncidentsForService } from "../repositories/incidentRepo";
import { listMaintenancesForService } from "../repositories/maintenanceRepo";
import { upsertWindow } from "../repositories/windowRepo";
import { msBetween } from "../utils/time";
import { unplannedDowntimeMs } from "../utils/ranges";

export async function computeServiceWindow(
  serviceId: string,
  policy: SlaPolicy,
  periodStartISO: string,
  periodEndISO: string
) {
  const [incidents, maints] = await Promise.all([
    listIncidentsForService(serviceId, periodStartISO, periodEndISO),
    listMaintenancesForService(serviceId, periodStartISO, periodEndISO),
  ]);

  const start = new Date(periodStartISO);
  const end = new Date(periodEndISO);

  let usedMs = 0;
  for (const inc of incidents) {
    const s = new Date(inc.startedAt);
    const e = new Date(inc.endedAt ?? new Date().toISOString());
    const cs = s < start ? start : s;
    const ce = e > end ? end : e;
    if (ce <= cs) continue;
    usedMs += unplannedDowntimeMs(cs, ce, maints);
  }

  const totalMs = msBetween(start, end);
  const allowedPct = policy.targetPct;
  const allowedMs = Math.max(0, Math.round(totalMs * (1 - allowedPct / 100)));
  const uptimePct = ((totalMs - usedMs) / totalMs) * 100;

  let status: WindowStatus;
  if (usedMs >= allowedMs && allowedMs > 0) status = WindowStatus.BREACHED;
  else {
    const now = new Date();
    const elapsed = Math.max(1, msBetween(start, now < end ? now : end));
    const projectedUsed = usedMs + (usedMs / elapsed) * (totalMs - elapsed);
    if ((projectedUsed >= allowedMs && allowedMs > 0) || (allowedMs - usedMs) < allowedMs * 0.25) status = WindowStatus.AT_RISK;
    else status = WindowStatus.OK;
  }

  const windowRow = await upsertWindow({
    id: "" as any,
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
  } as any);

  return windowRow;
}
