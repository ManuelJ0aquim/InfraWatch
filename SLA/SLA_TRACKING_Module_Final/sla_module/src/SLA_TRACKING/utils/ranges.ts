import { MaintenanceWindow } from "../domain/types";

export function unplannedDowntimeMs(
  incS: Date,
  incE: Date,
  maints: Pick<MaintenanceWindow, "startsAt" | "endsAt">[]
): number {
  const maint = maints
    .map(m => [new Date(m.startsAt), new Date(m.endsAt)] as [Date, Date])
    .filter(([s, e]) => e > s)
    .sort((a, b) => a[0].getTime() - b[0].getTime());

  const merged: [Date, Date][] = [];
  for (const [s, e] of maint) {
    if (!merged.length) { merged.push([s, e]); continue; }
    const last = merged[merged.length - 1];
    if (s <= last[1]) { if (e > last[1]) last[1] = e; }
    else merged.push([s, e]);
  }

  let covered = 0;
  const incStart = incS.getTime();
  const incEnd = incE.getTime();

  for (const [ms, me] of merged) {
    const s = Math.max(ms.getTime(), incStart);
    const e = Math.min(me.getTime(), incEnd);
    if (e > s) covered += (e - s);
  }
  const total = incEnd - incStart;
  return Math.max(0, total - covered);
}
