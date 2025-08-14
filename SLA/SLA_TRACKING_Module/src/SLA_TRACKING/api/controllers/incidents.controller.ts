import { FastifyReply, FastifyRequest } from "fastify";
import { listIncidentsForService, createIncident } from "../../repositories/incidentRepo";

export async function listIncidents(req: FastifyRequest, reply: FastifyReply) {
  const { id } = (req.params as any);
  const { from, to } = (req.query as any);
  if (!from || !to) return reply.status(400).send({ error: "from/to required (ISO)" });
  const data = await listIncidentsForService(id, from, to);
  return reply.send({ data });
}

export async function createIncidentHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = (req.params as any);
  const body = req.body as any;
  if (!body?.startedAt || !body?.endedAt) return reply.status(400).send({ error: "startedAt and endedAt required" });
  const inc = await createIncident({
    serviceId: id,
    startedAt: body.startedAt,
    endedAt: body.endedAt,
    isPlanned: !!body.isPlanned,
    source: body.source || "manual",
  } as any);
  return reply.status(201).send(inc);
}
