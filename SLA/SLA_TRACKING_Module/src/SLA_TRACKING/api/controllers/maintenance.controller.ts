import { FastifyReply, FastifyRequest } from "fastify";
import { createMaintenance, listMaintenancesForService } from "../../repositories/maintenanceRepo";

export async function listMaintenances(req: FastifyRequest, reply: FastifyReply) {
  const { id } = (req.params as any);
  const { from, to } = (req.query as any);
  if (!from || !to) return reply.status(400).send({ error: "from/to required (ISO)" });
  const data = await listMaintenancesForService(id, from, to);
  return reply.send({ data });
}

export async function createMaintenanceHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = (req.params as any);
  const body = req.body as any;
  if (!body?.startsAt || !body?.endsAt) return reply.status(400).send({ error: "startsAt/endsAt required" });
  const mw = await createMaintenance({
    serviceId: id,
    systemId: null,
    startsAt: body.startsAt,
    endsAt: body.endsAt,
    reason: body.reason || null,
    recurrenceRule: body.recurrenceRule || null,
  } as any);
  return reply.status(201).send(mw);
}
