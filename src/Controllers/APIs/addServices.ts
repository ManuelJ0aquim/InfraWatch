import { FastifyRequest, FastifyReply } from 'fastify';
import { ServiceType } from '@prisma/client';

export async function addService(request: FastifyRequest, reply: FastifyReply)
{
  const { name, type, target, ownerId } = request.body as { name: string; type: ServiceType; target: string; ownerId: string; };

  const userExists = await request.server.prisma.user.findUnique({ where: { id: ownerId } });
  if (!userExists)
  {
    return reply.code(400).send({ message: 'Owner not found' });
  }

  const service = await request.server.prisma.service.create({
    data: { name, type, target, ownerId }
  });

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
        threshold: 98, // exemplo de SLI
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
