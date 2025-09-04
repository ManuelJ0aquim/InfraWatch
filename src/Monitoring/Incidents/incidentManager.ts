import { PrismaClient } from "@prisma/client";
import { countRecentUps } from "../../Influxdb/WriteMetrics/WriteServiceStatus";

const prisma = new PrismaClient();

export async function findOrOpenIncident(serviceId: string, reason?: string)
{
  let incident = await prisma.incident.findFirst(
  {
    where: { serviceId, closedAt: null },
  });

  if (!incident)
  {
    incident = await prisma.incident.create({
      data: { serviceId, reason: reason ?? "auto-open" },
    });
  }
  return incident;
}

export async function closeIncidentIfRecovered( serviceId: string, recoveryConfirmations: number)
{
  try
  {
    const ups = await countRecentUps(serviceId, 5);
    const openIncidents = await prisma.incident.findMany(
    {
      where: { serviceId, closedAt: null },
    });

    if (openIncidents.length > 0 && ups >= recoveryConfirmations)
    {
      await prisma.incident.updateMany({
        where: { serviceId, closedAt: null },
        data: { closedAt: new Date(), reason: "auto-recovery" },
      });
    }
  }
  catch (err)
  {
    console.error( `Erro ao verificar recuperação do serviço ${serviceId}:`, err);
  }
}

export async function updateIncidentNotification( incidentId: string, retryCount: number)
{
  await prisma.incident.update(
  {
    where: { id: incidentId },
    data: { lastNotificationAt: new Date(), retryCount },
  });
}