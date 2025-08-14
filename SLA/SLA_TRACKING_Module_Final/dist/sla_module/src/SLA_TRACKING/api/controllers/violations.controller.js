"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listViolationsHandler = listViolationsHandler;
const violationRepo_1 = require("../../repositories/violationRepo");
async function listViolationsHandler(req, reply) {
    const { policyId } = req.params;
    const { from, to } = req.query;
    if (!from || !to) {
        return reply.status(400).send({ error: "from/to required (ISO)" });
    }
    const fromMs = Date.parse(from);
    const toMs = Date.parse(to);
    if (isNaN(fromMs) || isNaN(toMs)) {
        return reply.status(400).send({ error: "from/to must be valid ISO date strings" });
    }
    if (fromMs > toMs) {
        return reply.status(400).send({ error: "from must be earlier than to" });
    }
    const rows = await (0, violationRepo_1.listViolations)(policyId, new Date(fromMs).toISOString(), new Date(toMs).toISOString());
    return reply.send({ data: rows });
}
//# sourceMappingURL=violations.controller.js.map