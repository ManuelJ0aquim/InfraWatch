"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listIncidents = listIncidents;
exports.createIncidentHandler = createIncidentHandler;
const incidentRepo_1 = require("../../repositories/incidentRepo");
async function listIncidents(req, reply) {
    const { id } = req.params;
    const { from, to } = req.query;
    if (!from || !to) {
        return reply.status(400).send({ error: "from/to required (ISO)" });
    }
    // Validate ISO date strings and order
    const fromMs = Date.parse(from);
    const toMs = Date.parse(to);
    if (isNaN(fromMs) || isNaN(toMs)) {
        return reply.status(400).send({ error: "from/to must be valid ISO date strings" });
    }
    if (fromMs >= toMs) {
        return reply.status(400).send({ error: "from must be earlier than to" });
    }
    const data = await (0, incidentRepo_1.listIncidentsForService)(id, new Date(fromMs).toISOString(), new Date(toMs).toISOString());
    return reply.send({ data });
}
async function createIncidentHandler(req, reply) {
    const { id } = req.params;
    const body = req.body;
    if (!body?.startedAt || !body?.endedAt) {
        return reply.status(400).send({ error: "startedAt and endedAt required" });
    }
    const sMs = Date.parse(body.startedAt);
    const eMs = Date.parse(body.endedAt);
    if (isNaN(sMs) || isNaN(eMs)) {
        return reply.status(400).send({ error: "startedAt and endedAt must be valid ISO date strings" });
    }
    if (sMs >= eMs) {
        return reply.status(400).send({ error: "endedAt must be later than startedAt" });
    }
    const inc = await (0, incidentRepo_1.createIncident)({
        serviceId: id,
        startedAt: new Date(sMs).toISOString(),
        endedAt: new Date(eMs).toISOString(),
        isPlanned: !!body.isPlanned,
        source: typeof body.source === "string" ? body.source : "manual",
    });
    return reply.status(201).send(inc);
}
//# sourceMappingURL=incidents.controller.js.map