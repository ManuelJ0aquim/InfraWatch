import { getPrisma } from "../utils/prisma";
import { Violation } from "../domain/types";

export async function createViolation(v: Omit<Violation, "id" | "createdAt">): Promise<Violation> {
  const prisma = getPrisma();
  return await prisma.violation.create({ data: { ...v, createdAt: new Date().toISOString() } as any }) as any;
}
export async function listViolations(policyId: string, fromISO: string, toISO: string): Promise<Violation[]> {
  const prisma = getPrisma();
  return await prisma.violation.findMany({ where: { policyId, createdAt: { gte: fromISO, lte: toISO } }, orderBy: { createdAt: "asc" } }) as any;
}
