// processSlaAndAlerts.ts - VERSÃO CORRIGIDA

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

// 🔥 NOVO: Configuração de múltiplos níveis de escalonamento
interface EscalationLevel {
  level: number;
  triggerMinutes: number;
  description: string;
}

function getEscalationLevels(baseMinutes: number): EscalationLevel[] {
  return [
    { level: 1, triggerMinutes: 0, description: "Alerta inicial" },
    { level: 2, triggerMinutes: baseMinutes, description: "Escalado para supervisão" },
    { level: 3, triggerMinutes: baseMinutes * 3, description: "Escalado para gestão" },
    { level: 4, triggerMinutes: baseMinutes * 6, description: "Escalado para direção" },
    { level: 5, triggerMinutes: baseMinutes * 12, description: "Escalonamento máximo" }
  ];
}

// 🔥 NOVO: Determina o nível correto baseado no tempo decorrido
function calculateEscalationLevel(elapsedMinutes: number, retryCount: number, policy: any): number {
  const levels = getEscalationLevels(policy.escalateAfterMinutes);
  
  // Escalona por tempo OU por número de tentativas (o que vier primeiro)
  let levelByTime = 1;
  let levelByRetries = Math.min(5, Math.ceil(retryCount / policy.maxRetries) + 1);
  
  for (const level of levels) {
    if (elapsedMinutes >= level.triggerMinutes) {
      levelByTime = level.level;
    }
  }
  
  // Retorna o nível mais alto entre tempo e tentativas
  return Math.max(levelByTime, levelByRetries);
}

async function notifyContactsByLevel(
  serviceId: string,
  message: string,
  channels: string[],
  level: number
) {
  const contacts = await prisma.alertContact.findMany({
    where: { 
      serviceId, 
      active: true, 
      level: { lte: level } // 🔥 CORREÇÃO: Notifica TODOS os níveis até o atual
    },
    orderBy: { level: 'asc' }
  });

  console.log(`🔔 Notificando ${contacts.length} contatos até nível ${level}`);
  
  for (const contact of contacts) {
    if (channels.length === 0 || channels.includes(contact.channel)) {
      try {
        await sendAlert(contact.channel as any, contact.to, message);
        console.log(`✅ Alerta enviado via ${contact.channel} para ${contact.to} (nível ${contact.level})`);
      } catch (error) {
        console.error(`❌ Falha ao enviar alerta via ${contact.channel} para ${contact.to}:`, error);
      }
    }
  }
}

// 🔥 NOVO: Função para verificar se deve escalar
function shouldEscalate(incident: any, newLevel: number): boolean {
  const currentLevel = incident.escalationLevel || 1;
  return newLevel > currentLevel;
}

export async function processSlaAndAlerts(serviceId: string, issues: any[] = []) {
  const io = getIO();
  const downNow = issues.length > 0;

  if (downNow) {
    for (const issue of issues) {
      await writeServiceStatus({ serviceId: issue.serviceId, status: "DOWN" });
      const policy = await NotificationPolicyRepo.getEffectivePolicy(issue.serviceId);
      const incident = await findOrOpenIncident(issue.serviceId, issue.description);

      await writeSlaRecordToInflux({
        serviceId: issue.serviceId,
        serviceName: issue.serviceName,
        metric: "availability",
        value: 0,
        status: false,
        criticality: issue.severity,
      });

      // Calcula tempo decorrido desde o início do incidente
      const elapsedMinutes = incident.openedAt
        ? (Date.now() - incident.openedAt.getTime()) / 60000
        : 0;

      const nextRetry = (incident.retryCount ?? 0) + 1;
      
      // 🔥 NOVO: Calcula o nível correto de escalonamento
      const newLevel = calculateEscalationLevel(elapsedMinutes, nextRetry, policy);
      const currentLevel = incident.escalationLevel || 1;

      // Respeita cooldown entre notificações
      const spacing = Math.max(policy.retryIntervalMinutes, policy.cooldownMinutes);
      const canNotify = !incident.lastNotificationAt || minutesAgo(incident.lastNotificationAt, spacing);

      if (canNotify) {
        // Monta mensagem baseada no nível de escalonamento
        let alertMessage = `⚠️ ALERTA ${issue.severity?.toUpperCase?.() || "HIGH"}: ${issue.serviceName} - ${issue.description}`;
        
        if (shouldEscalate(incident, newLevel)) {
          const levels = getEscalationLevels(policy.escalateAfterMinutes);
          const levelInfo = levels.find(l => l.level === newLevel);
          alertMessage = `🚨 ESCALADO NÍVEL ${newLevel}: ${issue.serviceName} - ${levelInfo?.description || 'Escalonamento'}\n\n` +
                        `Tempo decorrido: ${Math.round(elapsedMinutes)} minutos\n` +
                        `Tentativas: ${nextRetry}/${policy.maxRetries}\n` +
                        `Descrição: ${issue.description}`;
        } else {
          alertMessage += ` (tentativa ${nextRetry}/${policy.maxRetries})`;
        }

        // 🔥 CORREÇÃO: Notifica até o nível atual
        await notifyContactsByLevel(
          issue.serviceId,
          alertMessage,
          policy.channels,
          newLevel
        );

        // Atualiza o incidente com novo nível
        await updateIncidentNotification(incident.id, nextRetry, newLevel);

        console.log(`📊 Incidente ${incident.id}: Nível ${currentLevel} → ${newLevel} (${Math.round(elapsedMinutes)}min, ${nextRetry} tentativas)`);
      }

      io.emit("slaViolation", {
        serviceId: issue.serviceId,
        serviceName: issue.serviceName,
        description: issue.description,
        severity: issue.severity,
        escalationLevel: newLevel,
        elapsedMinutes: Math.round(elapsedMinutes)
      });
    }
  } else {
    await writeServiceStatus({ serviceId, status: "UP" });
    const policy = await NotificationPolicyRepo.getEffectivePolicy(serviceId);
    
    // 🔥 NOVO: Notifica recuperação
    const openIncidents = await prisma.incident.findMany({ 
      where: { serviceId, closedAt: null } 
    });
    
    if (openIncidents.length > 0) {
      for (const incident of openIncidents) {
        const level = incident.escalationLevel || 1;
        await notifyContactsByLevel(
          serviceId,
          `✅ RECUPERADO: Serviço ${serviceId} voltou ao normal após ${incident.retryCount || 0} tentativas`,
          policy.channels,
          level
        );
      }
    }
    
    await closeIncidentIfRecovered(serviceId, policy.recoveryConfirmations);
  }
}