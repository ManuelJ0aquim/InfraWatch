// <<<<<<< HEAD

// import { getIO } from '../../socket';
// import { CheckSNMP } from '../Checkers/CheckSNMP';
// import { CheckHTTP } from '../Checkers/CheckHTTP';
// import { CheckPING } from '../Checkers/CheckPING';
// import { CheckWebhook } from '../Checkers/CheckWEBHOOK';
// import { PrismaClient, Service, ServiceType } from '@prisma/client';
// import { writeSnmpMetrics } from '../../Influxdb/WriteMetrics/WriteSnmpMetrics';
// import { writePingMetrics } from '../../Influxdb/WriteMetrics/WritePingMetrics';
// import { writeHttpMetrics } from '../../Influxdb/WriteMetrics/WriteHttpMetrics';
// import { writeWebhookMetrics } from '../../Influxdb/WriteMetrics/WriteWebhookMetrics';
// import { findOrOpenIncident, closeIncidentIfRecovered, updateIncidentNotification } from '../Incidents/incidentManager';

// const prisma = new PrismaClient();

// async function getServiceResult(service: Service) {
//   switch (service.type) {
//     case ServiceType.HTTP:
//       return CheckHTTP(service.target);
//     case ServiceType.PING:
//       return CheckPING(service.target);
//     case ServiceType.SNMP:
//       return CheckSNMP(service.target);
//     case ServiceType.WEBHOOK:
//       return CheckWebhook(service.target);
//     default:
//       return null;
//   }
// }

// async function processServiceResult(service: Service, result: any) {
//   const problems: Array<any> = [];

//   if (!result) {
//     problems.push({
//       serviceId: service.id,
//       serviceName: service.name,
//       metric: 'unknown',
//       value: 0,
//       status: 'DOWN',
//       description: 'Sem resposta ou resultado inválido',
//       criticality: 'high',
// =======
import { getIO } from "../../socket";
import { Problem } from "../../types/Problem";
import { analyzePingIssue } from "../../Analyzers/PingIssueAnalyzer";
import { analyzeHttpIssue } from "../../Analyzers/HttpIssueAnalyzer";
import { analyzeSnmpIssue } from "../../Analyzers/analyzeSnmpIssue";
import { writeSnmpMetrics } from "../../Influxdb/WriteMetrics/WriteSnmpMetrics";
import { writePingMetrics } from "../../Influxdb/WriteMetrics/WritePingMetrics";
import { writeHttpMetrics } from "../../Influxdb/WriteMetrics/WriteHttpMetrics";
import { PrismaClient } from "@prisma/client";
import { findOrOpenIncident, closeIncidentIfRecovered, updateIncidentNotification } from '../Incidents/incidentManager';

const prisma = new PrismaClient();

export async function processProxyData(data: any): Promise<Problem[]> {
  const io = getIO();
  const problems: Problem[] = [];

  console.log(data)

  if (!data || !data.type)
  {
    problems.push({
      serviceId: data?.id || "unknown",
      serviceName: data?.target || "unknown",
      metric: "unknown",
      value: 0,
      status: "UNKNOWN",
      description: "Dados inválidos recebidos do proxy",
      recommendation: "Verifique se o proxy está enviando os dados corretamente",
      priority: 2,
      severity: "WARNING",
      timestamp: new Date().toISOString(),
// >>>>>>> origin/main
    });
    const incident = await findOrOpenIncident(service.id);
    if (incident && incident.id) {
      await updateIncidentNotification(incident.id, (incident.retryCount || 0) + 1);
    } else {
      console.error(`Falha ao criar ou obter incidente para serviço ${service.id}`);
    }
    // await findOrOpenIncident(service.id);
    return problems;
  }

// <<<<<<< HEAD
//   const io = getIO();

//   switch (service.type) {
//     case ServiceType.SNMP: {
//       io.emit('snmpService', result);
//       writeSnmpMetrics(service.id, result);
//       const isDown = !result.sysName;
//       if (isDown) {
//         problems.push({
//           serviceId: service.id,
//           serviceName: service.name,
//           metric: 'SNMP',
//           value: 0,
//           status: 'DOWN',
//           description: 'SNMP não retornou nome do sistema',
//           criticality: 'high',
//         });
//       }
//       await prisma.service.update({
//         where: { id: service.id },
//         data: {
//           status: isDown ? 'DOWN' : 'UP',
//           sysName: result.sysName || null,
//           sysDescr: result.sysDescr || null,
//         },
//       });
//       break;
//     }
//     case ServiceType.PING: {
//       io.emit('pingService', { ...result, service });
//       writePingMetrics(service.id, result);
//       const isDown = result.status !== 'UP';
//       if (isDown) {
//         problems.push({
//           serviceId: service.id,
//           serviceName: service.name,
//           metric: 'PING',
//           value: result.avgMs ?? 0,
//           status: 'DOWN',
//           description: `Status: ${result.status}, perda de pacotes: ${result.lossPercent}%`,
//           lossPercent: result.lossPercent,
//           criticality: result.lossPercent === 100 ? 'critical' : 'high',
//         });
//       } else {
//         console.log(`Status UP para ${service.name}. Nenhum ticket criado.`);
//       }
//       await prisma.service.update({
//         where: { id: service.id },
//         data: {
//           status: isDown ? 'DOWN' : 'UP',
//           lastResponseMs: result.avgMs ?? null,
//         },
//       });
//       break;
//     }
//     case ServiceType.HTTP: {
//       io.emit('httpService', { ...result, service });
//       writeHttpMetrics(service.id, result);
//       const isDown = result.status !== 'UP';
//       if (isDown) {
//         problems.push({
//           serviceId: service.id,
//           serviceName: service.name,
//           metric: 'HTTP',
//           value: result.totalMs ?? 0,
//           status: 'DOWN',
//           description: `Status: ${result.status}, HTTP: ${result.httpStatus}, tempo total: ${result.totalMs}ms`,
//           criticality: result.httpStatus >= 500 ? 'critical' : 'high',
//         });
//       } else {
//         console.log(`Status UP para ${service.name}. Nenhum ticket criado.`);
//       }
//       await prisma.service.update({
//         where: { id: service.id },
//         data: {
//           status: isDown ? 'DOWN' : 'UP',
//           lastResponseMs: result.totalMs ?? null,
//         },
//       });
//       break;
//     }
//     case ServiceType.WEBHOOK: {
//       io.emit('webhookService', result);
//       writeWebhookMetrics(service.id, result);
//       const isDown = result.status !== 'UP';
//       if (isDown) {
//         problems.push({
//           serviceId: service.id,
//           serviceName: service.name,
//           metric: 'WEBHOOK',
//           value: result.totalMs ?? 0,
//           status: 'DOWN',
//           description: `Status: ${result.status}, HTTP: ${result.httpStatus}, tempo total: ${result.totalMs}ms`,
//           criticality: 'high',
//         });
//       }
//       await prisma.service.update({
//         where: { id: service.id },
//         data: {
//           status: isDown ? 'DOWN' : 'UP',
//           sysName: result.sysName || null,
//           sysDescr: result.sysDescr || null,
//         },
//       });
// =======
  switch (data.type)
  {
    case "SNMP":
      io.emit("snmpService", data);
      writeSnmpMetrics(data.id, data);
      const snmpAnalysis = analyzeSnmpIssue({ id: data.id, name: data.target }, data);
      if (snmpAnalysis)
        problems.push(snmpAnalysis);
      break;

    case "PING":
      io.emit("pingService", data);
      writePingMetrics(data.id, data);
      const pingAnalysis = analyzePingIssue({ id: data.id, name: data.target }, data);
      if (pingAnalysis)
        problems.push(pingAnalysis);
      break;

    case "HTTP":
      io.emit("httpService", data);
      writeHttpMetrics(data.id, data);
      const httpAnalysis = analyzeHttpIssue({ id: data.id, name: data.target }, data);
      if (httpAnalysis)
        problems.push(httpAnalysis);
// >>>>>>> origin/main
      break;
    default:
      break;
      return [];
  }

  // Verificar incidentes abertos antes de processar
  const existingIncident = await prisma.incident.findFirst({
    where: { serviceId: service.id, closedAt: null },
  });

  if (problems.length > 0 && !existingIncident) {
    const incident = await findOrOpenIncident(service.id);
    if (incident && incident.id) {
      await updateIncidentNotification(incident.id, (incident.retryCount || 0) + 1);
    }
  } else if (service.status === 'UP' && existingIncident) {
    await closeIncidentIfRecovered(service.id, 3);
  }

  return problems;
}

export async function detectIssues(serviceId?: string): Promise<Array<any>> {
  const problems: Array<any> = [];

  const services: Service[] = serviceId
    ? [await prisma.service.findUniqueOrThrow({ where: { id: serviceId } })]
    : await prisma.service.findMany();

  for (const service of services) {
    try {
      const result = await getServiceResult(service);
      const serviceProblems = await processServiceResult(service, result);
      problems.push(...serviceProblems);
    } catch (error) {
      problems.push({
        serviceId: service.id,
        serviceName: service.name,
        metric: 'unknown',
        value: 0,
        status: "UNKNOWN",
        description: `Tipo de serviço desconhecido: ${data.type}`,
        recommendation: "Verifique a configuração do proxy",
        priority: 2,
        severity: "WARNING",
        timestamp: new Date().toISOString(),
      });
      const incident = await findOrOpenIncident(service.id);
      if (incident && incident.id) {
        await updateIncidentNotification(incident.id, 1);
      }
    }
  }
  return problems;
}

function processServiceResult(service: Service, result: any) {
  throw new Error("Function not implemented.");
}

function getServiceResult(service: Service) {
  throw new Error("Function not implemented.");
}

