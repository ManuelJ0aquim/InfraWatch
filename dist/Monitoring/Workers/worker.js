"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMonitoring = startMonitoring;
const utills_worker_1 = require("./utills_worker");
async function startMonitoring() {
    console.log('🔍 Monitoramento iniciado...');
    await (0, utills_worker_1.checkServices)();
    setInterval(async () => { await (0, utills_worker_1.checkServices)(); }, 60 * 1000);
}
