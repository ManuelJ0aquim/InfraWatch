import { PrismaClient } from "@prisma/client";
import { countRecentUps } from "../../Influxdb/WriteMetrics/WriteServiceStatus";
import { createGlpiTicket, updateGlpiTicket } from "../IntegraçõesExternas/GLPI/GlpiClients";

const prisma = new PrismaClient();

export async function findOrOpenIncident(serviceId: string, reason?: string)
{
  let incident = await prisma.incident.findFirst({
    where: { serviceId, closedAt: null },
  });

  if (!incident)
  {
    incident = await prisma.incident.create({
      data: { serviceId, reason: reason ?? "auto-open" },
    });

    try
    {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { User: true },
      });

      if (!service) throw new Error("Serviço não encontrado no banco");

      const ticketId = await createGlpiTicket(
        service.name,
        reason ?? "Problema detectado automaticamente",
        service.criticality
      );

      await prisma.incident.update({
        where: { id: incident.id },
        data: { glpiTicketId: ticketId.toString() },
      });

      console.log(`Incidente ${incident.id} vinculado ao ticket GLPI ${ticketId}`);
    } catch (err) {
      console.error("Erro ao abrir ticket no GLPI:", err);
    }
  }

  return incident;
}

export async function closeIncidentIfRecovered(serviceId: string, recoveryConfirmations: number)
{
  try {
    const ups = await countRecentUps(serviceId, 5);
    const openIncidents = await prisma.incident.findMany({
      where: { serviceId, closedAt: null },
    });

    if (openIncidents.length > 0 && ups >= recoveryConfirmations) {
      for (const incident of openIncidents) {
        await prisma.incident.update({
          where: { id: incident.id },
          data: { closedAt: new Date(), reason: "auto-recovery" },
        });

        if (incident.glpiTicketId) {
          try {
            await updateGlpiTicket(parseInt(incident.glpiTicketId), {
              content: "Incidente recuperado automaticamente",
            });
            console.log(`Ticket GLPI ${incident.glpiTicketId} atualizado como resolvido.`);
          } catch (err) {
            console.error("Erro ao atualizar ticket no GLPI:", err);
          }
        }
      }
    }
  } catch (err) {
    console.error(`Erro ao verificar recuperação do serviço ${serviceId}:`, err);
  }
}

export async function updateIncidentNotification(incidentId: string, retryCount: number) {
  await prisma.incident.update({
    where: { id: incidentId },
    data: { lastNotificationAt: new Date(), retryCount },
  });
}
