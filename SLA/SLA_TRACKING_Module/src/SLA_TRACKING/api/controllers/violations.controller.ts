import { FastifyReply, FastifyRequest } from "fastify";
import { listViolations } from "../../repositories/violationRepo";

export async function listViolationsHandler(req: FastifyRequest, reply: FastifyReply) {
  const { policyId } = (req.params as any);
  const { from, to } = (req.query as any);
  if (!from || !to) return reply.status(400).send({ error: "from/to required (ISO)" });
  const rows = await listViolations(policyId, from, to);
  return reply.send({ data: rows });
}
