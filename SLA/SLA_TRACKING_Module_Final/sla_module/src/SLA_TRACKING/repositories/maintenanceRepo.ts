import { getPrisma } from "../utils/prisma";
import { MaintenanceWindow } from "../domain/types";

export async function listMaintenancesForService(serviceId: string, fromISO: string, toISO: string): Promise<MaintenanceWindow[]> {
  const prisma = getPrisma();
  const rows = await prisma.maintenanceWindow.findMany({
    where: { serviceId, startsAt: { lt: toISO }, endsAt: { gt: fromISO } },
    orderBy: { startsAt: "asc" }
  });
  return rows as any;
}
export async function createMaintenance(mw: Omit<MaintenanceWindow, "id">): Promise<MaintenanceWindow> {
  const prisma = getPrisma();
  return await prisma.maintenanceWindow.create({ data: mw as any }) as any;
}
