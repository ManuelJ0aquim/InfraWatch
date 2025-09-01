import { getIO } from "../../socket";
import { Problem } from "../../types/Problem";
import { analyzePingIssue } from "../../Analyzers/PingIssueAnalyzer";
import { analyzeHttpIssue } from "../../Analyzers/HttpIssueAnalyzer";
import { analyzeWebhookIssue } from "../../Analyzers/analyzeWebhookIssue";
import { analyzeSnmpIssue } from "../../Analyzers/analyzeSnmpIssue";
import { writeSnmpMetrics } from "../../Influxdb/WriteMetrics/WriteSnmpMetrics";
import { writePingMetrics } from "../../Influxdb/WriteMetrics/WritePingMetrics";
import { writeHttpMetrics } from "../../Influxdb/WriteMetrics/WriteHttpMetrics";
import { writeWebhookMetrics } from "../../Influxdb/WriteMetrics/WriteWebhookMetrics";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function processProxyData(data: any): Promise<Problem[]> {
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
    return problems;
  }

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
      writeHttpMetrics(data.id, data);
      const httpAnalysis = analyzeHttpIssue({ id: data.id, name: data.target }, data);
      if (httpAnalysis)
        problems.push(httpAnalysis);
      break;

    case "WEBHOOK":
      writeWebhookMetrics(data.id, data);
      const webhookAnalysis = analyzeWebhookIssue({ id: data.id, name: data.target }, data);
      if (webhookAnalysis)
        problems.push(webhookAnalysis);
      break;

    default:
      problems.push({
        serviceId: data.id,
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
  return problems;
}

