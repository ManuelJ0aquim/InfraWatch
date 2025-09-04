"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxyReceiverRoutes = proxyReceiverRoutes;
const worker2_1 = require("../../Monitoring/Workers/worker2");
const slaWorker_1 = require("../../Monitoring/Workers/slaWorker");
async function proxyReceiverRoutes(fastify) {
    fastify.post("/proxy-data", async (request, reply) => {
        try {
            const data = request.body;
            const issues = await (0, worker2_1.processProxyData)(data);
            for (const issue of issues) {
                await (0, slaWorker_1.processSlaAndAlerts)(data.serviceId, [issue]);
            }
            return { status: "ok", issues };
        }
        catch (error) {
            request.log.error(error);
            return reply.status(500).send({ status: "error", message: error.message });
        }
    });
}
