import { FastifyReply, FastifyRequest } from "fastify";
import { createPolicy, listPolicies } from "../../repositories/policyRepo";

export async function listPoliciesHandler(_req: FastifyRequest, reply: FastifyReply) {
  const rows = await listPolicies();
  return reply.send({ data: rows });
}

export async function createPolicyHandler(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as any;
  const required = ["targetPct", "period", "timezone"];
  for (const k of required) if (!(k in body)) return reply.status(400).send({ error: `${k} is required` });
  const created = await createPolicy({
    serviceId: body.serviceId || null,
    systemId: body.systemId || null,
    targetPct: body.targetPct,
    period: body.period,
    timezone: body.timezone,
    activeFrom: body.activeFrom || new Date().toISOString(),
    activeTo: body.activeTo || null,
  });
  return reply.status(201).send(created);
}
