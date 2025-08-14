import { FastifyReply, FastifyRequest } from "fastify";
import { createMaintenance, listMaintenancesForService } from "../../repositories/maintenanceRepo";

export async function listMaintenances(req: FastifyRequest, reply: FastifyReply) {
  const { id } = (req.params as any);
  const { from, to } = (req.query as any);
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
  const data = await listMaintenancesForService(id, new Date(fromMs).toISOString(), new Date(toMs).toISOString());
  return reply.send({ data });
}

export async function createMaintenanceHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = (req.params as any);
  const body = req.body as any;
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
  const mw = await createMaintenance({
    serviceId: id,
    systemId: null,
    startsAt: new Date(sMs).toISOString(),
    endsAt: new Date(eMs).toISOString(),
    reason: typeof body.reason === "string" ? body.reason : null,
    recurrenceRule: typeof body.recurrenceRule === "string" ? body.recurrenceRule : null,
  } as any);
  return reply.status(201).send(mw);
}
