import { getPrisma } from "../utils/prisma";
import { SlaWindow } from "../domain/types";

export async function upsertWindow(win: Omit<SlaWindow, "id">): Promise<SlaWindow> {
  const prisma = getPrisma();
  const existing = await prisma.slaWindow.findFirst({
    where: { serviceId: win.serviceId ?? undefined, systemId: win.systemId ?? undefined, periodStart: win.periodStart, periodEnd: win.periodEnd },
  });
  if (existing) {
    const updated = await prisma.slaWindow.update({ where: { id: existing.id }, data: { ...win, computedAt: new Date().toISOString() } as any });
    return updated as any;
  }
  const created = await prisma.slaWindow.create({ data: win as any });
  return created as any;
}

export async function getWindow(serviceId: string, periodStart: string, periodEnd: string): Promise<SlaWindow | null> {
  const prisma = getPrisma();
  return await prisma.slaWindow.findFirst({ where: { serviceId, periodStart, periodEnd } }) as any;
}

export async function listWindows(serviceId: string, fromISO: string, toISO: string): Promise<SlaWindow[]> {
  const prisma = getPrisma();
  return await prisma.slaWindow.findMany({
    where: { serviceId, OR: [{ periodStart: { gte: fromISO, lt: toISO } }, { periodEnd: { gt: fromISO, lte: toISO } }] },
    orderBy: { periodStart: "asc" }
  }) as any;
}
