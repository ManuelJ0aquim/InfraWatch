"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMonitoring = startMonitoring;
const scheduler_1 = require("../Queue/scheduler");
require("../Queue/monitoringWorker");
async function startMonitoring() {
    console.log('InfraWatch Em Acção...');
    await (0, scheduler_1.startQueueScheduler)();
}
