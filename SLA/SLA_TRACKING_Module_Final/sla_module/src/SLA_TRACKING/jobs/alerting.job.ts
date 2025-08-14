import { getPrisma } from "../utils/prisma";

export async function runAlertingCycle() {
  const prisma = getPrisma();
  const nowISO = new Date().toISOString();
  const atRisk = await prisma.slaWindow.findMany({ where: { status: "AT_RISK" } });
  const breached = await prisma.slaWindow.findMany({ where: { status: "BREACHED" } });

  if (atRisk.length) console.log(`[SLA_ALERT][AT_RISK] count=${atRisk.length} at ${nowISO}`);
  if (breached.length) console.log(`[SLA_ALERT][BREACHED] count=${breached.length} at ${nowISO}`);
  // To integrate with our NotificationController
}
