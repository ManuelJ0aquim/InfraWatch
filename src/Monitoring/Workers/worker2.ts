import { getIO } from '../../socket';
import { CheckSNMP } from '../Checkers/CheckSNMP';
import { CheckHTTP } from '../Checkers/CheckHTTP';
import { CheckPING } from '../Checkers/CheckPING';
import { CheckWebhook } from '../Checkers/CheckWEBHOOK';
import { PrismaClient, Service, ServiceType } from '@prisma/client';
import { writeSnmpMetrics } from '../../Influxdb/WriteMetrics/WriteSnmpMetrics';
import { writePingMetrics } from '../../Influxdb/WriteMetrics/WritePingMetrics';
import { writeHttpMetrics } from '../../Influxdb/WriteMetrics/WriteHttpMetrics';
import { writeWebhookMetrics } from '../../Influxdb/WriteMetrics/WriteWebhookMetrics';

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

async function processServiceResult(service: Service, result: any)
{
  const problems: Array<any> = [];

  if (!result)
  {
    problems.push(
    {
      serviceId: service.id,
      serviceName: service.name,
      metric: 'unknown',
      value: 0,
      status: 'DOWN',
      description: 'Sem resposta ou resultado inválido',
    });
    return problems;
  }

  const io = getIO();

  switch (service.type)
  {
    case ServiceType.SNMP:
    {
      io.emit("snmpService", result);
      writeSnmpMetrics(service.id, result);
      const isDown = !result.sysName;
      if (isDown)
      {
        problems.push(
        {
          serviceId: service.id,
          serviceName: service.name,
          metric: 'SNMP',
          value: 0,
          status: 'DOWN',
          description: 'SNMP não retornou nome do sistema',
        });
      }
      break;
    }

    case ServiceType.PING:
    {
      io.emit("pingService", result);
      writePingMetrics(service.id, result);
      const isDown = result.status !== 'UP';
      if (isDown) {
        problems.push({
          serviceId: service.id,
          serviceName: service.name,
          metric: 'PING',
          value: result.avgMs ?? 0,
          status: 'DOWN',
          description: `Status: ${result.status}, perda de pacotes: ${result.lossPercent}%, min/avg/max/mdev: ${result.minMs}/${result.avgMs}/${result.maxMs}/${result.mdevMs}`,
          lossPercent: result.lossPercent,
        });
      }
      break;
    }

    case ServiceType.HTTP:
    {
      io.emit("httpService", result);
      writeHttpMetrics(service.id, result);
      const isDown = result.status !== 'UP';
      if (isDown) {
        problems.push({
          serviceId: service.id,
          serviceName: service.name,
          metric: 'HTTP',
          value: result.totalMs ?? 0,
          status: 'DOWN',
          description: `Status: ${result.status}, HTTP: ${result.httpStatus}, tempo total: ${result.totalMs}ms`,
        });
      }
      break;
    }

    case ServiceType.WEBHOOK:
    {
      io.emit("webhookService", result);
      writeWebhookMetrics(service.id, result);
      const isDown = result.status !== 'UP';
      if (isDown) {
        problems.push({
          serviceId: service.id,
          serviceName: service.name,
          metric: 'WEBHOOK',
          value: result.totalMs ?? 0,
          status: 'DOWN',
          description: `Status: ${result.status}, HTTP: ${result.httpStatus}, tempo total: ${result.totalMs}ms`,
        });
      }
      break;
    }
    default:
      return [];
  }
  return problems;
}

export async function detectIssues(serviceId?: string): Promise<Array<any>>
{
  const problems: Array<any> = [];
  
  const services: Service[] = serviceId
    ? [await prisma.service.findUniqueOrThrow({ where: { id: serviceId } })]
    : await prisma.service.findMany();

  for (const service of services)
  {
    try
    {
      const result = await getServiceResult(service);
      const serviceProblems = await processServiceResult(service, result);

      for (const p of serviceProblems)
      {
        let criticality = 'medium';
        if (p.metric === 'PING')
        {
          if (p.lossPercent === 100)
            criticality = 'critical';
          else if (p.lossPercent >= 50)
            criticality = 'high';
        }
        if (p.metric === 'HTTP')
        {
          if (result.httpStatus >= 500)
            criticality = 'critical';
          else if (result.httpStatus >= 400)
            criticality = 'high';
        }
        if (p.metric === 'SNMP' || p.metric === 'WEBHOOK')
        {
          criticality = p.status === 'DOWN' ? 'high' : 'medium';
        }
        problems.push({ ...p, criticality });
      }
    }
    catch (error)
    {
      problems.push(
      {
        serviceId: service.id,
        serviceName: service.name,
        metric: 'unknown',
        value: 0,
        status: 'DOWN',
        description: `Erro ao monitorar: ${(error as Error).message}`,
        criticality: 'high',
      });
    }
  }
  return problems;
}
