"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMaintenances = listMaintenances;
exports.createMaintenanceHandler = createMaintenanceHandler;
const maintenanceRepo_1 = require("../../repositories/maintenanceRepo");
async function listMaintenances(req, reply) {
    const { id } = req.params;
    const { from, to } = req.query;
    if (!from || !to) {
        return reply.status(400).send({ error: "from/to required (ISO)" });
    }
    const fromMs = Date.parse(from);
    const toMs = Date.parse(to);
    if (isNaN(fromMs) || isNaN(toMs)) {
        return reply.status(400).send({ error: "from/to must be valid ISO date strings" });
    }
    if (fromMs >= toMs) {
        return reply.status(400).send({ error: "from must be earlier than to" });
    }
    const data = await (0, maintenanceRepo_1.listMaintenancesForService)(id, new Date(fromMs).toISOString(), new Date(toMs).toISOString());
    return reply.send({ data });
}
async function createMaintenanceHandler(req, reply) {
    const { id } = req.params;
    const body = req.body;
    if (!body?.startsAt || !body?.endsAt) {
        return reply.status(400).send({ error: "startsAt/endsAt required" });
    }
    const sMs = Date.parse(body.startsAt);
    const eMs = Date.parse(body.endsAt);
    if (isNaN(sMs) || isNaN(eMs)) {
        return reply.status(400).send({ error: "startsAt and endsAt must be valid ISO date strings" });
    }
    if (sMs >= eMs) {
        return reply.status(400).send({ error: "endsAt must be later than startsAt" });
    }
    const mw = await (0, maintenanceRepo_1.createMaintenance)({
        serviceId: id,
        systemId: null,
        startsAt: new Date(sMs).toISOString(),
        endsAt: new Date(eMs).toISOString(),
        reason: typeof body.reason === "string" ? body.reason : null,
        recurrenceRule: typeof body.recurrenceRule === "string" ? body.recurrenceRule : null,
    });
    return reply.status(201).send(mw);
}
//# sourceMappingURL=maintenance.controller.js.map