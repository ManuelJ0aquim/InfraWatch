import { getPrisma } from "../utils/prisma";
import { SlaPolicy } from "../domain/types";

export async function getActivePolicyForService(serviceId: string): Promise<SlaPolicy | null> {
  const prisma = getPrisma();
  const p = await prisma.slaPolicy.findFirst({ where: { serviceId, activeTo: null }, orderBy: { createdAt: "desc" } });
  return p as any;
}
export async function listPolicies(): Promise<SlaPolicy[]> {
  const prisma = getPrisma(); return (await prisma.slaPolicy.findMany({})) as any;
}
export async function createPolicy(data: Omit<SlaPolicy, "id"|"createdAt"|"updatedAt">): Promise<SlaPolicy> {
  const prisma = getPrisma(); return await prisma.slaPolicy.create({ data: data as any }) as any;
}
