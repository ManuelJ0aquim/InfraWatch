"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckWebhook = CheckWebhook;
const axios_1 = __importDefault(require("axios"));
const perf_hooks_1 = require("perf_hooks");
const dns_1 = __importDefault(require("dns"));
const util_1 = require("util");
const lookup = (0, util_1.promisify)(dns_1.default.lookup);
async function CheckWebhook(url, payload = { ping: true }, // Payload padrão
timeout = 5000) {
    const timings = {};
    const startTotal = perf_hooks_1.performance.now();
    try {
        // 🔹 1. Resolver DNS
        const startDNS = perf_hooks_1.performance.now();
        const { address } = await lookup(new URL(url).hostname);
        timings.dnsMs = perf_hooks_1.performance.now() - startDNS;
        // 🔹 2. Enviar POST e medir tempo
        const startHTTP = perf_hooks_1.performance.now();
        const res = await axios_1.default.post(url, payload, {
            timeout,
            responseType: 'arraybuffer' // Permite medir tamanho real da resposta
        });
        timings.httpMs = perf_hooks_1.performance.now() - startHTTP;
        const totalTime = perf_hooks_1.performance.now() - startTotal;
        return {
            status: res.status >= 200 && res.status < 300 ? 'UP' : 'DOWN',
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
