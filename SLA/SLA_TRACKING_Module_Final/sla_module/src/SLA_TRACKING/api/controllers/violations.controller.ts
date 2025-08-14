import { FastifyReply, FastifyRequest } from "fastify";
import { listViolations } from "../../repositories/violationRepo";

export async function listViolationsHandler(req: FastifyRequest, reply: FastifyReply) {
  const { policyId } = (req.params as any);
  const { from, to } = (req.query as any);
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
  const rows = await listViolations(policyId, new Date(fromMs).toISOString(), new Date(toMs).toISOString());
  return reply.send({ data: rows });
}
