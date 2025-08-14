// Build incidents from raw status samples using hysteresis, min duration, merge.
import { getPrisma } from "../utils/prisma";
import { HYSTERESIS_FAILURES, MIN_INCIDENT_DURATION_MS, MERGE_GAP_MS } from "../domain/constants";

export interface StatusSample { timeISO: string; up: boolean; }

export async function buildIncidentsFromSamples(serviceId: string, samples: StatusSample[]) {
  const prisma = getPrisma();
  samples.sort((a, b) => a.timeISO.localeCompare(b.timeISO));

  let failStreak = 0;
  let currentDownStart: Date | null = null;
  const finalized: [Date, Date][] = [];

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const t = new Date(s.timeISO);
    if (!s.up) {
      failStreak++;
      if (failStreak >= HYSTERESIS_FAILURES && !currentDownStart) currentDownStart = t;
    } else {
      if (currentDownStart) {
        const end = t;
        if (end.getTime() - currentDownStart.getTime() >= MIN_INCIDENT_DURATION_MS) finalized.push([currentDownStart, end]);
        currentDownStart = null;
      }
      failStreak = 0;
    }
  }
  if (currentDownStart) {
    const end = new Date();
    if (end.getTime() - currentDownStart.getTime() >= MIN_INCIDENT_DURATION_MS) finalized.push([currentDownStart, end]);
  }

  const merged: [Date, Date][] = [];
  for (const [s, e] of finalized) {
    if (!merged.length) { merged.push([s, e]); continue; }
    const last = merged[merged.length - 1];
    if (s.getTime() - last[1].getTime() <= MERGE_GAP_MS) { if (e > last[1]) last[1] = e; }
    else merged.push([s, e]);
  }

  for (const [s, e] of merged) {
    await prisma.incident.create({
      data: { serviceId, startedAt: s.toISOString(), endedAt: e.toISOString(), isPlanned: false, source: "samples", createdAt: new Date().toISOString() } as any
    });
  }
  return merged.length;
}
