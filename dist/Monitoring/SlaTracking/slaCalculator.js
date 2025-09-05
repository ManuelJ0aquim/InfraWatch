"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlaCalculator = void 0;
exports.inferSampleIntervalMs = inferSampleIntervalMs;
exports.computeDurations = computeDurations;
const influxdb_1 = require("../../Influxdb/influxdb");
function assertEnvBucket() {
    const bucket = process.env.INFLUX_BUCKET?.trim();
    if (!bucket)
        throw new Error("INFLUX_BUCKET não definido.");
    return bucket;
}
function sanitizeServiceId(id) {
    return id.replace(/"/g, '\\"');
}
function isUpValue(v) {
    if (typeof v === "string") {
        const s = v.trim().toLowerCase();
        if (s === "up" || s === "1" || s === "true")
            return true;
        if (s === "down" || s === "0" || s === "false")
            return false;
        return false;
    }
    if (typeof v === "number")
        return v === 1;
    if (typeof v === "boolean")
        return v;
    return false;
}
async function queryRows(flux) {
    return new Promise((resolve, reject) => {
        const rows = [];
        influxdb_1.queryApi.queryRows(flux, {
            next: (row, tableMeta) => { rows.push(tableMeta.toObject(row)); },
            error: reject,
            complete: () => resolve(rows),
        });
    });
}
function inferSampleIntervalMs(points) {
    if (points.length < 2)
        return 300000;
    const deltas = [];
    for (let i = 1; i < points.length; i++)
        deltas.push(points[i].getTime() - points[i - 1].getTime());
    deltas.sort((a, b) => a - b);
    const mid = Math.floor(deltas.length / 2);
    return deltas.length % 2 ? deltas[mid] : Math.floor((deltas[mid - 1] + deltas[mid]) / 2);
}
function computeDurations(start, end, rows, lastBefore, inferredMs) {
    const maxGap = 3 * inferredMs;
    let upMs = 0, downMs = 0, unknownMs = 0;
    let prevTime = start;
    let currState = lastBefore ? lastBefore.state : "UNKNOWN";
    const addSpan = (ms) => {
        if (currState === "UP")
            upMs += ms;
        else if (currState === "DOWN")
            downMs += ms;
        else
            unknownMs += ms;
    };
    for (const r of rows) {
        const t = r.time;
        if (t <= prevTime) {
            currState = r.state;
            continue;
        }
        const dt = t.getTime() - prevTime.getTime();
        if (dt <= maxGap)
            addSpan(dt);
        else {
            addSpan(maxGap);
            unknownMs += dt - maxGap;
        }
        prevTime = t;
        currState = r.state;
    }
    if (end > prevTime) {
        const dt = end.getTime() - prevTime.getTime();
        if (dt <= maxGap)
            addSpan(dt);
        else {
            addSpan(maxGap);
            unknownMs += dt - maxGap;
        }
    }
    const denom = upMs + downMs;
    const pctByTime = denom > 0 ? (upMs / denom) * 100 : null;
    return { upDurationMs: upMs, downDurationMs: downMs, unknownDurationMs: unknownMs, uptimePercentageByTime: pctByTime };
}
class SlaCalculator {
    static async calculate(serviceId, start, end) {
        if (!(start instanceof Date) || isNaN(start.getTime()))
            throw new Error("Parâmetro 'start' inválido.");
        if (!(end instanceof Date) || isNaN(end.getTime()))
            throw new Error("Parâmetro 'end' inválido.");
        if (start >= end)
            throw new Error("Intervalo inválido: 'start' deve ser anterior a 'end'.");
        const bucket = assertEnvBucket();
        const sid = sanitizeServiceId(serviceId);
        const startIso = start.toISOString();
        const endIso = end.toISOString();
        const fluxRange = `
      from(bucket: "${bucket}")
        |> range(start: ${startIso}, stop: ${endIso})
        |> filter(fn: (r) => r._measurement == "service_status")
        |> filter(fn: (r) => r._field == "status")
        |> filter(fn: (r) => r.serviceId == "${sid}")
        |> keep(columns: ["_time", "_value"])
        |> sort(columns: ["_time"], desc: false)
    `;
        const rowsRange = await queryRows(fluxRange);
        const points = rowsRange.map(r => ({ time: new Date(r._time), state: isUpValue(r._value) ? "UP" : "DOWN" }));
        const fluxLastBefore = `
      from(bucket: "${bucket}")
        |> range(start: ${new Date(0).toISOString()}, stop: ${startIso})
        |> filter(fn: (r) => r._measurement == "service_status")
        |> filter(fn: (r) => r._field == "status")
        |> filter(fn: (r) => r.serviceId == "${sid}")
        |> keep(columns: ["_time", "_value"])
        |> last()
    `;
        const lastRows = await queryRows(fluxLastBefore);
        const lastBefore = lastRows.length ? { time: new Date(lastRows[0]._time), state: isUpValue(lastRows[0]._value) ? "UP" : "DOWN" } : null;
        const totalChecks = rowsRange.length;
        const upChecks = rowsRange.filter(r => isUpValue(r._value)).length;
        const downChecks = totalChecks - upChecks;
        const uptimePercentage = totalChecks > 0 ? (upChecks / totalChecks) * 100 : null;
        const inferredSampleIntervalMs = inferSampleIntervalMs(points.map(p => p.time));
        const byTime = computeDurations(start, end, points, lastBefore, inferredSampleIntervalMs);
        return {
            serviceId,
            start,
            end,
            totalChecks,
            upChecks,
            downChecks,
            uptimePercentage,
            upDurationMs: byTime.upDurationMs,
            downDurationMs: byTime.downDurationMs,
            unknownDurationMs: byTime.unknownDurationMs,
            uptimePercentageByTime: byTime.uptimePercentageByTime,
            inferredSampleIntervalMs,
        };
    }
}
exports.SlaCalculator = SlaCalculator;
