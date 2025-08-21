"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckHTTP = CheckHTTP;
const axios_1 = __importDefault(require("axios"));
const perf_hooks_1 = require("perf_hooks");
const dns_1 = __importDefault(require("dns"));
const util_1 = require("util");
const lookup = (0, util_1.promisify)(dns_1.default.lookup);
async function CheckHTTP(target) {
    const timings = {};
    const startTotal = perf_hooks_1.performance.now();
    try {
        // 🔹 Tempo DNS
        const startDNS = perf_hooks_1.performance.now();
        const { address } = await lookup(new URL(target).hostname);
        timings.dnsMs = perf_hooks_1.performance.now() - startDNS;
        // 🔹 Tempo de conexão + download
        const startHTTP = perf_hooks_1.performance.now();
        const res = await axios_1.default.get(target, { timeout: 5000, responseType: 'arraybuffer' });
        timings.httpMs = perf_hooks_1.performance.now() - startHTTP;
        const totalTime = perf_hooks_1.performance.now() - startTotal;
        return {
            status: 'UP',
            httpStatus: res.status,
            ip: address,
            sizeBytes: res.data.length,
            dnsMs: timings.dnsMs,
            connectAndDownloadMs: timings.httpMs,
            totalMs: totalTime,
            headers: res.headers
        };
    }
    catch (err) {
        const totalTime = perf_hooks_1.performance.now() - startTotal;
        return {
            status: 'DOWN',
            reason: err.code || err.message,
            totalMs: totalTime
        };
    }
}
