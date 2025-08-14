import { FastifyReply, FastifyRequest } from "fastify";
import { listIncidentsForService, createIncident } from "../../repositories/incidentRepo";

export async function listIncidents(req: FastifyRequest, reply: FastifyReply) {
  const { id } = (req.params as any);
  const { from, to } = (req.query as any);
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
  const data = await listIncidentsForService(id, new Date(fromMs).toISOString(), new Date(toMs).toISOString());
  return reply.send({ data });
}

export async function createIncidentHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = (req.params as any);
  const body = req.body as any;
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
  const inc = await createIncident({
    serviceId: id,
    startedAt: new Date(sMs).toISOString(),
    endedAt: new Date(eMs).toISOString(),
    isPlanned: !!body.isPlanned,
    source: typeof body.source === "string" ? body.source : "manual",
  } as any);
  return reply.status(201).send(inc);
}
