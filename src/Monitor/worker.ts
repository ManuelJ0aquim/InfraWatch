import { PrismaClient, ServiceType, Status } from '@prisma/client';
import { checkHTTP, checkPING, checkSNMPFull, checkWebhook } from './checkers';
import { writeMetric, writeSnmpMetrics } from '../influxdb';
import { NotificationController } from '../Controllers/APIs/Notification';

const prisma = new PrismaClient();
const notificationController = new NotificationController();

const alertContacts = [
  { channel: 'email', to: 'marquessanches007@gmail.com' },
  // { channel: 'twilio', to: '+244925560046' },
  // { channel: 'telegram', to: '123456789' },
  // { channel: 'slack', to: '#alertas' },
];


async function detectIssues(): Promise<Array<{ serviceName: string; description: string }>> {
  const problems: Array<{ serviceName: string; description: string }> = [];

  const services = await prisma.service.findMany();

  for (const service of services) {
    try {
      let result: any;

      switch (service.type) {
        case ServiceType.HTTP:
          result = await checkHTTP(service.target);
          break;
        case ServiceType.PING:
          result = await checkPING(service.target);
          break;
        case ServiceType.SNMP:
          result = await checkSNMPFull(service.target);
          break;
        case ServiceType.WEBHOOK:
          result = await checkWebhook(service.target);
          break;
        default:
          continue;
      }

      if (!result) {
        problems.push({
          serviceName: service.name,
          description: 'Sem resposta ou resultado inválido',
        });
        continue;
      }

      if (service.type === ServiceType.SNMP) {
        // Para SNMP: registra métrica e atualiza status
        writeSnmpMetrics(service.id, result);
        if (!result.sysName) {
          problems.push({
            serviceName: service.name,
            description: 'SNMP não retornou nome do sistema',
          });
        }
      } else {
        // Para HTTP, PING e Webhook: registra métrica e atualiza status
        writeMetric(service.id, result.status, result.responseMs);

        if (result.status !== Status.UP) {
          problems.push({
            serviceName: service.name,
            description: `Status: ${result.status}, tempo resposta: ${result.responseMs}ms`,
          });
        }
      }

      await prisma.service.update({
        where: { id: service.id },
        data: {
          status: service.type === ServiceType.SNMP ? Status.UP : result.status,
          lastResponseMs: result.responseMs,
          sysName: service.type === ServiceType.SNMP ? result.sysName || null : null,
          sysDescr: service.type === ServiceType.SNMP ? result.sysDescr || null : null,
        },
      });

    } catch (error) {
      // Se erro, marca serviço como DOWN e adiciona problema
      await prisma.service.update({
        where: { id: service.id },
        data: { status: Status.DOWN },
      });

      problems.push({
        serviceName: service.name,
        description: `Erro ao monitorar: ${(error as Error).message}`,
      });
    }
  }

  return problems;
}

async function sendAlert(channel: 'email' | 'slack' | 'telegram' | 'twilio', to: string, message: string)
{
    try
    {
      await notificationController.send(channel, to, message);
      console.log(`Alerta enviado via ${channel} para ${to}`);
    }
    catch (error)
    {
      console.error(`Erro ao enviar alerta via ${channel} para ${to}:`, error);
    }
}

async function checkServices()
{
    const issues = await detectIssues();

    let size = issues.length;
    let i = 0;

    if (size === 0)
    {
      console.log('✅ Todos os serviços estão operando normalmente.');
      return;
    }

    while (i < size)
    {
      const issue = issues[i];
      const message = `⚠️ Serviço ${issue.serviceName} está com problema: ${issue.description}`;

      let j = 0;
      while (j < alertContacts.length)
      {
        const contact = alertContacts[j];
        await sendAlert(contact.channel as any, contact.to, message);
        j++;
      }
      i++;
    }
}

export async function startMonitoring()
{
  console.log('🔍 Monitoramento iniciado...');
  await checkServices();
  setInterval(async () =>
  {
    await checkServices();
  }, 60 * 1000);
}

