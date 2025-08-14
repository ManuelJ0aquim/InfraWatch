"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildIncidentsFromSamples = buildIncidentsFromSamples;
// Build incidents from raw status samples using hysteresis, min duration, merge.
const prisma_1 = require("../utils/prisma");
const constants_1 = require("../domain/constants");
async function buildIncidentsFromSamples(serviceId, samples) {
    const prisma = (0, prisma_1.getPrisma)();
    samples.sort((a, b) => a.timeISO.localeCompare(b.timeISO));
    let failStreak = 0;
    let currentDownStart = null;
    const finalized = [];
    for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        const t = new Date(s.timeISO);
        if (!s.up) {
            failStreak++;
            if (failStreak >= constants_1.HYSTERESIS_FAILURES && !currentDownStart)
                currentDownStart = t;
        }
        else {
            if (currentDownStart) {
                const end = t;
                if (end.getTime() - currentDownStart.getTime() >= constants_1.MIN_INCIDENT_DURATION_MS)
                    finalized.push([currentDownStart, end]);
                currentDownStart = null;
            }
            failStreak = 0;
        }
    }
    if (currentDownStart) {
        const end = new Date();
        if (end.getTime() - currentDownStart.getTime() >= constants_1.MIN_INCIDENT_DURATION_MS)
            finalized.push([currentDownStart, end]);
    }
    const merged = [];
    for (const [s, e] of finalized) {
        if (!merged.length) {
            merged.push([s, e]);
            continue;
        }
        const last = merged[merged.length - 1];
        if (s.getTime() - last[1].getTime() <= constants_1.MERGE_GAP_MS) {
            if (e > last[1])
                last[1] = e;
        }
        else
            merged.push([s, e]);
    }
    for (const [s, e] of merged) {
        await prisma.incident.create({
            data: { serviceId, startedAt: s.toISOString(), endedAt: e.toISOString(), isPlanned: false, source: "samples", createdAt: new Date().toISOString() }
        });
    }
    return merged.length;
}
//# sourceMappingURL=ingestStatus.job.js.map