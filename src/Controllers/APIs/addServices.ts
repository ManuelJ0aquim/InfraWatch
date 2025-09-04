import { FastifyRequest, FastifyReply } from 'fastify';
import { ServiceType } from '@prisma/client';

export async function addService(request: any, reply: FastifyReply)
{
  const {ownerId} = request.params;

  const { name, type, target } = request.body as { name: string; type: ServiceType; target: string;};

  console.log(ownerId)

  const service = await request.server.prisma.service.create({
    data: { name, type, target, ownerId }
  });

  console.log(service)

  await createDefaultSLIsForService(service.id, type, request.server.prisma);

  return reply.code(201).send(service);
}

async function createDefaultSLIsForService(serviceId: string, type: ServiceType, prisma: any)
{
  const defaultSLIs = [];

  switch (type)
  {
    case ServiceType.PING:
      defaultSLIs.push(
      {
        serviceId,
        metric: 'PING',
        threshold: 98,
        comparison: 'gte',
      });
      break;

    case ServiceType.HTTP:
      defaultSLIs.push(
      {
        serviceId,
        metric: 'HTTP',
        threshold: 98,
        comparison: 'gte',
      });
      break;

    case ServiceType.WEBHOOK:
      defaultSLIs.push(
      {
        serviceId,
        metric: 'WEBHOOK',
        threshold: 98,
        comparison: 'gte',
      });
      break;

    case ServiceType.SNMP:
      defaultSLIs.push(
      {
        serviceId,
        metric: 'SNMP',
        threshold: 95,
        comparison: 'gte',
      });
      break;
  }

  for (const sli of defaultSLIs)
  {
    await prisma.sliTarget.create({ data: sli });
  }
}