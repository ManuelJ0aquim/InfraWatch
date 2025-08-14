"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPoliciesHandler = listPoliciesHandler;
exports.createPolicyHandler = createPolicyHandler;
const policyRepo_1 = require("../../repositories/policyRepo");
async function listPoliciesHandler(_req, reply) {
    const rows = await (0, policyRepo_1.listPolicies)();
    return reply.send({ data: rows });
}
async function createPolicyHandler(req, reply) {
    const body = req.body;
    const required = ["targetPct", "period", "timezone"];
    for (const k of required) {
        if (!(k in body)) {
            return reply.status(400).send({ error: `${k} is required` });
        }
    }
    // Exactly one of serviceId or systemId must be provided
    if (!body.serviceId && !body.systemId) {
        return reply.status(400).send({ error: "Either serviceId or systemId is required" });
    }
    if (body.serviceId && body.systemId) {
        return reply.status(400).send({ error: "Provide only one of serviceId or systemId, not both" });
    }
    // Validate targetPct range
    const targetPct = Number(body.targetPct);
    if (isNaN(targetPct) || targetPct < 0 || targetPct > 100) {
        return reply.status(400).send({ error: "targetPct must be a number between 0 and 100" });
    }
    // Validate period
    if (body.period !== "MONTH") {
        return reply.status(400).send({ error: "period must be 'MONTH'" });
    }
    // Basic timezone check: must be a non‑empty string
    if (typeof body.timezone !== "string" || !body.timezone.trim()) {
        return reply.status(400).send({ error: "timezone must be a non‑empty string" });
    }
    // Optional activeFrom/activeTo validation: ensure valid ISO if provided
    let activeFrom = body.activeFrom;
    if (activeFrom && isNaN(Date.parse(activeFrom))) {
        return reply.status(400).send({ error: "activeFrom must be an ISO date string" });
    }
    let activeTo = body.activeTo;
    if (activeTo && isNaN(Date.parse(activeTo))) {
        return reply.status(400).send({ error: "activeTo must be an ISO date string" });
    }
    const created = await (0, policyRepo_1.createPolicy)({
        serviceId: body.serviceId || null,
        systemId: body.systemId || null,
        targetPct: targetPct,
        period: body.period,
        timezone: body.timezone,
        activeFrom: activeFrom || new Date().toISOString(),
        activeTo: activeTo || null,
    });
    return reply.status(201).send(created);
}
//# sourceMappingURL=policies.controller.js.map