import { getIO } from "../../socket";
import { CheckSNMP } from "../Checkers/CheckSNMP";
import { CheckHTTP } from "../Checkers/CheckHTTP";
import { CheckPING } from "../Checkers/CheckPING";
import { CheckWebhook } from "../Checkers/CheckWEBHOOK";

import { analyzePingIssue } from "../../Analyzers/PingIssueAnalyzer";
import { analyzeHttpIssue } from "../../Analyzers/HttpIssueAnalyzer";
import { analyzeWebhookIssue } from "../../Analyzers/analyzeWebhookIssue";
import { analyzeSnmpIssue } from "../../Analyzers/analyzeSnmpIssue";

import { Problem } from "../../types/Problem";
import { PrismaClient, Service, ServiceType } from "@prisma/client";

import { writeSnmpMetrics } from "../../Influxdb/WriteMetrics/WriteSnmpMetrics";
import { writePingMetrics } from "../../Influxdb/WriteMetrics/WritePingMetrics";
import { writeHttpMetrics } from "../../Influxdb/WriteMetrics/WriteHttpMetrics";
import { writeWebhookMetrics } from "../../Influxdb/WriteMetrics/WriteWebhookMetrics";

const prisma = new PrismaClient();

async function getServiceResult(service: Service)
{
  switch (service.type)
  {
    case ServiceType.HTTP:
      return CheckHTTP(service.target);
    case ServiceType.PING:
      return CheckPING(service.target);
    case ServiceType.SNMP:
      return CheckSNMP(service.target);
    case ServiceType.WEBHOOK:
      return CheckWebhook(service.target);
    default:
      return null;
  }
}

async function processServiceResult(service: Service, result: any): Promise<Problem[]>
{
  const io = getIO();
  const problems: Problem[] = [];

  if (!result)
  {
    problems.push(
    {
      serviceId: service.id,
      serviceName: service.name,
      metric: "unknown",
      value: 0,
      status: "UNKNOWN",
      description: "Sem resposta ou resultado inválido.",
      recommendation:
        "Verifique conectividade do host e configuração do serviço.",
      priority: 2,
      severity: "WARNING",
      timestamp: new Date().toISOString(),
    });
    return problems;
  }

  switch (service.type)
  {
    case ServiceType.SNMP:
    {
      io.emit("snmpService", { ...result, service });
      writeSnmpMetrics(service.id, result);

      const analysis = analyzeSnmpIssue(service, result);
      if (analysis)
        problems.push(analysis);
      break;
    }

    case ServiceType.PING:
    {
      io.emit("pingService", { ...result, service });
      writePingMetrics(service.id, result);

      const analysis = analyzePingIssue(service, result);
      if (analysis)
        problems.push(analysis);
      break;
    }

    case ServiceType.HTTP:
    {
      io.emit("httpService", { ...result, service });
      writeHttpMetrics(service.id, result);

      const analysis = analyzeHttpIssue(service, result);
      if (analysis)
        problems.push(analysis);
      break;
    }

    case ServiceType.WEBHOOK:
    {
      io.emit("webhookService", { ...result, service });
      writeWebhookMetrics(service.id, result);

      const analysis = analyzeWebhookIssue(service, result);
      if (analysis)
        problems.push(analysis);
      break;
    }
  }
  return problems;
}

export async function detectIssues(serviceId?: string): Promise<Problem[]>
{
  const problems: Problem[] = [];

  const services: Service[] = serviceId
    ? [
        await prisma.service.findUnique({ where: { id: serviceId } }),
      ].filter((s): s is Service => s !== null)
    : await prisma.service.findMany();

  for (const service of services)
  {
    try
    {
      const result = await getServiceResult(service);
      const serviceProblems = await processServiceResult(service, result);
      problems.push(...serviceProblems);
    }
    catch (error)
    {
      problems.push(
      {
        serviceId: service.id,
        serviceName: service.name,
        metric: "unknown",
        value: 0,
        status: "UNKNOWN",
        description: `Erro ao monitorar serviço: ${(error as Error).message}`,
        recommendation: "Verifique logs da aplicação e conectividade da rede.",
        priority: 1,
        severity: "CRITICAL",
        timestamp: new Date().toISOString(),
      });
    }
  }
  return problems;
}
