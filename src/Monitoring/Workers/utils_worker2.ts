import { CheckSNMP } from '../Checkers/CheckSNMP';
import { CheckHTTP } from '../Checkers/CheckHTTP';
import { CheckPING } from '../Checkers/CheckPING';
import { CheckWebhook } from '../Checkers/CheckWEBHOOK';
import { getIO } from '../../socket';
import { PrismaClient, Service, ServiceType, Status } from '@prisma/client';
import { writeMetric, writeSnmpMetrics, writePingMetrics, writeHttpMetrics, writeWebhookMetrics } from '../../influxdb';

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
    const problems: Array<{ serviceName: string; description: string }> = [];
  
    if (!result)
    {
      problems.push(
      {
        serviceName: service.name,
        description: 'Sem resposta ou resultado inválido',
      });
      return problems;
    }
  
    if (service.type === ServiceType.SNMP)
    {
      const io = getIO();
      io.emit("snmpService", result);
      writeSnmpMetrics(service.id.toString(), result);
  
      if (!result.sysName)
      {
        problems.push(
        {
          serviceName: service.name,
          description: 'SNMP não retornou nome do sistema',
        });
      }
  
      await (prisma.service as any).update(
      {
        where: { id: service.id },
        data:
        {
          status: Status.UP,
          sysName: result.sysName || null,
          sysDescr: result.sysDescr || null,
        },
      });
    }
    else if (service.type === ServiceType.PING)
    {
      const io = getIO();
      io.emit("pingService", result);
      writePingMetrics(service.id.toString(), result);
  
      if (result.status !== Status.UP)
      {
        problems.push(
        {
          serviceName: service.name,
          description: `Status: ${result.status}, Tempo de Processamento: ${result.minMs / result.avgMs / result.maxMs / result.mdevMs},
            perda de pacotes: ${result.lossPercent}%, Pacotes Transmitidos: ${result.transmitted},
            Pacotes Recebidos: ${result.received}, Quantidade de dados(bytes) ${result.data.length}`,
        });
      }
  
      await (prisma.service as any).update(
      {
        where: { id: service.id },
        data:
        {
          status: result.status,
          lastResponseMs: result.avgMs,
        },
      });
    }
    else if (service.type === ServiceType.HTTP)
    {
      const io = getIO();
      io.emit("httpService", result);
      writeHttpMetrics(service.id.toString(), result);
  
      if (result.status !== Status.UP)
      {
        problems.push(
        {
          serviceName: service.name,
          description: `Status: ${result.status}, HTTP: ${result.httpStatus}, tempo total: ${result.totalMs}ms`,
        });
      }

    }
    else if (service.type === ServiceType.WEBHOOK)
    {
      const io = getIO();
      io.emit("webhookService", result);
      writeWebhookMetrics(service.id.toString(), result);
  
      if (result.status !== Status.UP)
      {
        problems.push(
        {
          serviceName: service.name,
          description: `Status: ${result.status}, HTTP: ${result.httpStatus}, tempo total: ${result.totalMs}ms`,
        });
      }
  
      await (prisma.service as any).update(
      {
        where: { id: service.id },
        data:
        {
          status: result.status,
          lastResponseMs: result.totalMs,
        },
      });
    }
    else
    {
      writeMetric(service.id.toString(), result.status, result.responseMs);
  
      if (result.status !== Status.UP)
      {
        problems.push(
        {
          serviceName: service.name,
          description: `Status: ${result.status}, tempo resposta: ${result.responseMs}ms`,
        });
      }
  
      await (prisma.service as any).update(
      {
        where: { id: service.id },
        data:
        {
          status: result.status,
          lastResponseMs: result.responseMs,
        },
      });
    }
    return problems;
  }  

export async function detectIssues(): Promise<Array<{ serviceName: string; description: string }>>
{
  const problems: Array<{ serviceName: string; description: string }> = [];
  const services = await (prisma.service as any).findMany();

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
      await (prisma.service as any).update(
      {
        where: { id: service.id },
        data: { status: Status.DOWN },
      });

      problems.push(
      {
        serviceName: service.name,
        description: `Erro ao monitorar: ${(error as Error).message}`,
      });
    }
  }
  return problems;
}
