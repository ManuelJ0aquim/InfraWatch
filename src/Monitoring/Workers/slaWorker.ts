import { PrismaClient } from "@prisma/client";
import { getIO } from "../../socket";
import { writeSlaRecordToInflux } from "../../Influxdb/WriteMetrics/WriteSlaRecord";
import { writeServiceStatus } from "../../Influxdb/WriteMetrics/WriteServiceStatus";
import { sendAlert } from "../../Notifications/Notification";
import { NotificationPolicyRepo } from "../../Repositories/notificationPolicyRepo";
import { findOrOpenIncident, closeIncidentIfRecovered, updateIncidentNotification } from "../Incidents/incidentManager";

export const prisma = new PrismaClient();

function minutesAgo(date: Date, minutes: number): boolean {
  return new Date(Date.now() - minutes * 60 * 1000) > date;
}

async function notifyContacts(
  serviceId: string,
  message: string,
  channels: string[],
) {
  const contacts = await prisma.alertContact.findMany({
    where: { serviceId, active: true },
  });

  for (const c of contacts) {
    if (channels.length === 0 || channels.includes(c.channel)) {
      await sendAlert(c.channel as any, c.to, message);
    }
  }
}

export async function processSlaAndAlerts(serviceId: string, issues: any[] = []) {
  const io = getIO();
  const downNow = issues.length > 0;

  if (downNow) {
    for (const issue of issues) {
      await writeServiceStatus({
        serviceId: issue.serviceId,
        status: "DOWN",
      });

      const policy = await NotificationPolicyRepo.getEffectivePolicy(issue.serviceId);

      const incident = await findOrOpenIncident(issue.serviceId);
      if (!incident) {
        console.error(`Falha ao criar ou obter incidente para serviço ${issue.serviceId}`);
        continue;
      }

      await writeSlaRecordToInflux({
        serviceId: issue.serviceId,
        serviceName: issue.serviceName,
        metric: "availability",
        value: 0,
        status: false,
        criticality: issue.severity,
      });

      const canNotify =
        !incident.lastNotificationAt ||
        minutesAgo(incident.lastNotificationAt, policy.cooldownMinutes);

      if (canNotify) {
        const nextRetry = (incident.retryCount ?? 0) + 1;

        await notifyContacts(
          issue.serviceId,
          `ALERTA ${issue.severity.toUpperCase()}: ${issue.serviceName} - ${issue.description} (retry ${nextRetry}/${policy.maxRetries})`,
          policy.channels,
        );

        await updateIncidentNotification(incident.id, nextRetry);
      }

      io.emit("slaViolation", {
        serviceId: issue.serviceId,
        serviceName: issue.serviceName,
        description: issue.description,
        severity: issue.severity,
      });
    }
  } else {
    await writeServiceStatus({ serviceId, status: "UP" });
  
    const policy = await NotificationPolicyRepo.getEffectivePolicy(serviceId);
    await closeIncidentIfRecovered(serviceId, policy.recoveryConfirmations);

  }
}