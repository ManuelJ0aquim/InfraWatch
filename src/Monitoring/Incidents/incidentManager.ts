// import { PrismaClient } from "@prisma/client";
// import { countRecentUps } from "../../Influxdb/WriteMetrics/WriteServiceStatus";
// import axios from 'axios';
// import { closeGlpiTicket, createGlpiTicket } from "../../Integrations/GLPI/ticketManager";

// const prisma = new PrismaClient();
// const INFRAWATCH_API_URL = 'http://localhost:3002/api';

// export async function findOrOpenIncident(serviceId: string, reason?: string)
// {
//   try {
//     // Fetch service details
//     const service = await prisma.service.findUnique({
//       where: { id: serviceId },
//     });
//     if (!service) {
//       console.error(`Serviço ${serviceId} não encontrado`);
//       return null;
//     }

//     // Determine metrics endpoint based on service type
//     const metricsEndpoint = {
//       HTTP: `${INFRAWATCH_API_URL}/services/${serviceId}/metrics/http`,
//       PING: `${INFRAWATCH_API_URL}/services/${serviceId}/metrics/ping`,
//       SNMP: `${INFRAWATCH_API_URL}/services/${serviceId}/metrics/snmp`,
//       WEBHOOK: `${INFRAWATCH_API_URL}/services/${serviceId}/metrics/webhook`,
//     }[service.type] || `${INFRAWATCH_API_URL}/services/${serviceId}/metrics/http`;

//     // Fetch metrics
//     let status = 'UNKNOWN';
//     let metrics: any = {};
//     try {
//       const metricsResponse = await axios.get(metricsEndpoint, {
//         headers: { accept: 'application/json' },
//       });
//       metrics = metricsResponse.data[0] || {};
//       status = metrics.status || (await countRecentUps(serviceId, 5) >= 3 ? 'UP' : 'DOWN');
//     } catch (error) {
//       console.error(`Falha ao buscar métricas para serviço ${serviceId}:`, error.message);
//       status = (await countRecentUps(serviceId, 5) >= 3) ? 'UP' : 'DOWN';
//     }

//     // Determine reason for alert
//     let reason = 'auto-open';
//     if (status === 'DOWN') {
//       reason = 'Serviço caiu';
//     } else if (service.type === 'HTTP' && metrics.httpStatus >= 400) {
//       reason = `Erro HTTP ${metrics.httpStatus}`;
//     } else if (service.type === 'PING' && metrics.percent_packet_loss > 50) {
//       reason = `Perda de pacotes alta (${metrics.percent_packet_loss}%)`;
//     } else if (service.type === 'SNMP' && metrics.cpuUsage && metrics.cpuUsage > 90) {
//       reason = `CPU acima de 90% (${metrics.cpuUsage}%)`;
//     } else if (service.type === 'SNMP' && metrics.diskUsage && metrics.diskUsage > 90) {
//       reason = `Disco cheio (${metrics.diskUsage}%)`;
//     }

//     // Check for open incident
//     let incident = await prisma.incident.findFirst({
//       where: { serviceId, closedAt: null },
//     });

//     if (!incident && (status === 'DOWN' || reason !== 'auto-open')) {
//       // Create GLPI ticket
//       const ticketResult = await createGlpiTicket(serviceId, service.name, service.type, reason);
//       if (ticketResult) {
//         incident = await prisma.incident.create({
//           data: {
//             id: undefined, // Let Prisma generate UUID
//             serviceId,
//             reason,
//             openedAt: new Date(),
//             glpiTicketId: ticketResult.ticketId,
//             glpiTicketUrl: ticketResult.ticketUrl,
//           },
//         });
//         console.log(`Incidente criado para serviço ${serviceId}, Ticket GLPI: ${ticketResult.ticketId}`);
//       }
//     }
//     return incident;
//   } catch (error) {
//     console.error(`Erro em findOrOpenIncident para serviço ${serviceId}:`, error.message);
//     throw error;
//   }
// }

// export async function closeIncidentIfRecovered(serviceId: string, recoveryConfirmations: number) {
//   try {
//     const ups = await countRecentUps(serviceId, 5);
//     const openIncidents = await prisma.incident.findMany({
//       where: { serviceId, closedAt: null },
//     });

//     if (openIncidents.length > 0 && ups >= recoveryConfirmations) {
//       for (const incident of openIncidents) {
//         if (incident.glpiTicketId) {
//           await closeGlpiTicket(incident.glpiTicketId);
//         }
//         await prisma.incident.update({
//           where: { id: incident.id },
//           data: { closedAt: new Date(), reason: 'auto-recovery' },
//         });
//         console.log(`Incidente fechado para serviço ${serviceId}, Ticket GLPI: ${incident.glpiTicketId}`);
//       }
//     }
//   } catch (error) {
//     console.error(`Erro ao verificar recuperação do serviço ${serviceId}:`, error.message);
//   }
// }

// export async function updateIncidentNotification(incidentId: string, retryCount: number) {
//   console.log(`Chamando updateIncidentNotification com incidentId: ${incidentId}, retryCount: ${retryCount}`);
//   try {
//     const incident = await prisma.incident.findUnique({
//       where: { id: incidentId },
//     });
//     if (!incident) {
//       console.error(`Incidente ${incidentId} não encontrado`);
//       return;
//     }
//     await prisma.incident.update({
//       where: { id: incidentId },
//       data: { lastNotificationAt: new Date(), retryCount },
//     });
//     console.log(`Notificação atualizada para incidente ${incidentId}, retryCount: ${retryCount}`);
//   } catch (error) {
//     console.error(`Erro ao atualizar notificação do incidente ${incidentId}:`, error.message);
//   }
// }

import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { countRecentUps } from '../../Influxdb/WriteMetrics/WriteServiceStatus';
import { createGlpiTicket, closeGlpiTicket } from '../../Integrations/GLPI/ticketManager';

const prisma = new PrismaClient();
const INFRAWATCH_API_URL = 'http://localhost:3002/api';

export async function findOrOpenIncident(serviceId: string) {
  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      console.error(`Serviço ${serviceId} não encontrado`);
      return null;
    }

    const metricsEndpoint = {
      HTTP: `${INFRAWATCH_API_URL}/services/${serviceId}/metrics/http`,
      PING: `${INFRAWATCH_API_URL}/services/${serviceId}/metrics/ping`,
      SNMP: `${INFRAWATCH_API_URL}/services/${serviceId}/metrics/snmp`,
      WEBHOOK: `${INFRAWATCH_API_URL}/services/${serviceId}/metrics/webhook`,
    }[service.type] || `${INFRAWATCH_API_URL}/services/${serviceId}/metrics/http`;

    let status = 'UNKNOWN';
    let metrics: any = {};
    try {
      const metricsResponse = await axios.get(metricsEndpoint, {
        headers: { accept: 'application/json' },
      });
      metrics = metricsResponse.data[0] || {};
      status = metrics.status || (await countRecentUps(serviceId, 5) >= 3 ? 'UP' : 'DOWN');
    } catch (error) {
      console.error(`Falha ao buscar métricas para serviço ${serviceId}:`, error.message);
      status = (await countRecentUps(serviceId, 5) >= 3) ? 'UP' : 'DOWN';
    }

    let reason = 'No issues detected';
    let criticality = service.criticality || 'medium';
    if (status === 'DOWN') {
      reason = 'Serviço caiu';
      criticality = 'critical';
    } else if (service.type === 'HTTP' && metrics.httpStatus >= 400) {
      reason = `Erro HTTP ${metrics.httpStatus}`;
      criticality = metrics.httpStatus >= 500 ? 'critical' : 'high';
    } else if (service.type === 'PING' && metrics.percent_packet_loss > 50) {
      reason = `Perda de pacotes alta (${metrics.percent_packet_loss}%)`;
      criticality = metrics.percent_packet_loss === 100 ? 'critical' : 'high';
    } else if (service.type === 'SNMP' && metrics.cpuUsage && metrics.cpuUsage > 90) {
      reason = `CPU acima de 90% (${metrics.cpuUsage}%)`;
      criticality = 'critical';
    } else if (service.type === 'SNMP' && metrics.diskUsage && metrics.diskUsage > 90) {
      reason = `Disco cheio (${metrics.diskUsage}%)`;
      criticality = 'critical';
    }

    // Verificar incidente aberto
    const incident = await prisma.incident.findFirst({
      where: { serviceId, closedAt: null },
    });

    // Só criar incidente se houver um problema real
    if (!incident && (status === 'DOWN' || reason !== 'No issues detected')) {
      const ticketResult = await createGlpiTicket(serviceId, service.name, service.type, reason, criticality);
      if (ticketResult) {
        const newIncident = await prisma.incident.create({
          data: {
            id: undefined, // Deixa o Prisma gerar UUID
            serviceId,
            reason,
            openedAt: new Date(),
            glpiTicketId: String(ticketResult.ticketId),
            glpiTicketUrl: ticketResult.ticketUrl,
          },
        });
        console.log(`Incidente criado para serviço ${serviceId}, Ticket GLPI: ${ticketResult.ticketId}`);
        return newIncident;
      } else {
        console.error(`Falha ao criar ticket para serviço ${serviceId}, incidente não criado`);
        return null;
      }
    } else if (incident && status === 'UP' && reason === 'No issues detected') {
      await closeIncidentIfRecovered(serviceId, 3);
      return null; // Não retornar incidente fechado
    }

    return incident;
  } catch (error) {
    console.error(`Erro em findOrOpenIncident para serviço ${serviceId}:`, error.message);
    return null;
  }
}

export async function closeIncidentIfRecovered(serviceId: string, recoveryConfirmations: number) {
  try {
    const ups = await countRecentUps(serviceId, 5);
    const openIncidents = await prisma.incident.findMany({
      where: { serviceId, closedAt: null },
    });

    if (openIncidents.length > 0 && ups >= recoveryConfirmations) {
      for (const incident of openIncidents) {
        if (incident.glpiTicketId) {
          await closeGlpiTicket(Number(incident.glpiTicketId));
        } else {
          console.warn(`Incidente ${incident.id} para serviço ${serviceId} não tem ticket GLPI associado`);
        }
        await prisma.incident.update({
          where: { id: incident.id },
          data: { closedAt: new Date(), reason: 'auto-recovery' },
        });
        console.log(`Incidente fechado para serviço ${serviceId}, Ticket GLPI: ${incident.glpiTicketId || 'null'}`);
      }
    } else if (openIncidents.length > 0) {
      console.log(`Serviço ${serviceId} ainda não recuperado. Incidente(s) mantido(s) aberto(s).`);
    }
  } catch (error) {
    console.error(`Erro ao verificar recuperação do serviço ${serviceId}:`, error.message);
  }
}

export async function updateIncidentNotification(incidentId: string, retryCount: number) {
  console.log(`Chamando updateIncidentNotification com incidentId: ${incidentId}, retryCount: ${retryCount}`);
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
    });
    if (!incident) {
      console.error(`Incidente ${incidentId} não encontrado`);
      return;
    }
    await prisma.incident.update({
      where: { id: incidentId },
      data: { lastNotificationAt: new Date(), retryCount },
    });
    console.log(`Notificação atualizada para incidente ${incidentId}, retryCount: ${retryCount}`);
  } catch (error) {
    console.error(`Erro ao atualizar notificação do incidente ${incidentId}:`, error.message);
  }
}