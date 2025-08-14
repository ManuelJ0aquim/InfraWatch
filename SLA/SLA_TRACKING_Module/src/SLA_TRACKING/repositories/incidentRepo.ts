import { getPrisma } from "../utils/prisma";
import { Incident } from "../domain/types";

export async function listIncidentsForService(serviceId: string, fromISO: string, toISO: string): Promise<Incident[]> {
  const prisma = getPrisma();
  const rows = await prisma.incident.findMany({
    where: {
      serviceId,
      OR: [{ startedAt: { lt: toISO }, endedAt: { gt: fromISO } }, { startedAt: { gte: fromISO, lte: toISO } }]
    },
    orderBy: { startedAt: "asc" }
  });
  return rows as any;
}
export async function createIncident(inc: Omit<Incident, "id" | "createdAt">): Promise<Incident> {
  const prisma = getPrisma();
  return await prisma.incident.create({
    data: { ...inc, createdAt: new Date().toISOString() } as any
  }) as any;
}
