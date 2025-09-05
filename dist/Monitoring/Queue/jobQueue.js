"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringQueue = void 0;
exports.enqueueServiceCheck = enqueueServiceCheck;
const bullmq_1 = require("bullmq");
const redis_1 = require("./redis");
exports.monitoringQueue = new bullmq_1.Queue('monitoring', { connection: redis_1.redisConnection });
async function enqueueServiceCheck(serviceId) {
    await exports.monitoringQueue.add('check', { serviceId }, {
        removeOnComplete: 1000,
        removeOnFail: 500,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
    });
}
