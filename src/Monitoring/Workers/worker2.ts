import { getIO } from "../../socket";
import { Problem } from "../../types/Problem";
import { analyzePingIssue } from "../../Analyzers/PingIssueAnalyzer";
import { analyzeHttpIssue } from "../../Analyzers/HttpIssueAnalyzer";
import { analyzeSnmpIssue } from "../../Analyzers/analyzeSnmpIssue";
import { writeSnmpMetrics } from "../../Influxdb/WriteMetrics/WriteSnmpMetrics";
import { writePingMetrics } from "../../Influxdb/WriteMetrics/WritePingMetrics";
import { writeHttpMetrics } from "../../Influxdb/WriteMetrics/WriteHttpMetrics";
import { closeIncidentIfRecovered, findOrOpenIncident, updateIncidentNotification } from "../Incidents/incidentManager";
import { prisma } from "./slaWorker";
import { Service } from "@prisma/client"

export async function processProxyData(data: any): Promise<Problem[]>
{
  const io = getIO();
  const problems: Problem[] = [];
  
  console.log(data)
  
  if (!data || !data.type) {
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
    });

    const incident = await findOrOpenIncident(service.id);
    if (incident && incident.id) {
      await updateIncidentNotification(incident.id, (incident.retryCount || 0) + 1);
    } else {
      console.error(`Falha ao criar ou obter incidente para serviço ${service.id}`);
    }
    return problems;
  }
  
  switch (data.type)
  {
    case "SNMP":
      io.emit("snmpService", data);
      await writeSnmpMetrics(data.serviceId, data);
      const snmpAnalysis = await analyzeSnmpIssue({ id: data.serviceId, name: data.target }, data);
      if (snmpAnalysis)
        problems.push(snmpAnalysis);
      break;
      
      case "PING":
        io.emit("pingService", data);
        await writePingMetrics(data.serviceId, data);
        const pingAnalysis = analyzePingIssue({ id: data.serviceId, name: data.target }, data);
        if (pingAnalysis)
          problems.push(pingAnalysis);
      break;

      case "HTTP":
      io.emit("httpService", data);
      await writeHttpMetrics(data.serviceId, data);
      const httpAnalysis = analyzeHttpIssue({ id: data.serviceId, name: data.target }, data);
      if (httpAnalysis)
        problems.push(httpAnalysis);
      break;
    
    default:
      problems.push({
        serviceId: data.serviceId,
        serviceName: data.target,
        metric: "unknown",
        value: 0,
        status: "UNKNOWN",
        description: `Tipo de serviço desconhecido: ${data.type}`,
        recommendation: "Verifique a configuração do proxy",
        priority: 2,
        severity: "WARNING",
        timestamp: new Date().toISOString(),
      });
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
