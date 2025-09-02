import { FastifyRequest, FastifyReply } from 'fastify';
import { ServiceType } from '@prisma/client';
import { syncServiceToGLPI } from '../../Integrations/GLPI/syncServices';

interface AddServiceRequest {
  name: string;
  type: ServiceType;
  target: string;
  ownerId: string;
  criticality?: string;
}

// export async function addService(request: FastifyRequest, reply: FastifyReply)
export async function addService(request: FastifyRequest<{ Body: AddServiceRequest }>, reply: FastifyReply)
{
  const { name, type, target, ownerId, criticality } = request.body as { name: string; type: ServiceType; target: string; ownerId: string; criticality: string; };

  try
  {
    const userExists = await request.server.prisma.user.findUnique({ where: { id: ownerId } });
    if (!userExists)
    {
      return reply.code(400).send({ message: 'Owner not found' });
    }
    // Validate type
    const validTypes = ['HTTP', 'PING', 'SNMP', 'WEBHOOK'];
    if (!validTypes.includes(type)) {
      return reply.code(400).send({ message: 'Invalid service type. Use: HTTP, PING, SNMP, WEBHOOK' });
    }

    // Validate criticality (if provided)
    const validCriticalities = ['low', 'medium', 'high', 'critical'];
    if (criticality && !validCriticalities.includes(criticality)) {
      return reply.code(400).send({ message: 'Invalid criticality. Use: low, medium, high, critical' });
    }
    const service = await request.server.prisma.service.create({
      data: { name, type, target, ownerId, criticality: criticality || 'medium', status: 'UNKNOWN', }
    });

    await createDefaultSLIsForService(service.id, type, request.server.prisma);

    // Sync to GLPI
    try {
      await syncServiceToGLPI(service.id);
    } catch (error) {
      console.error(`Failed to sync service ${service.id} to GLPI:`, error.message);
      // Continue to return the service, as GLPI sync failure shouldn't block creation
    }

    // return reply.code(201).send(service);
    return reply.code(201).send({
        id: service.id,
        name: service.name,
        type: service.type,
        target: service.target,
        ownerId: service.ownerId,
        criticality: service.criticality,
        status: service.status,
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
    });
  }catch (error) {
    console.error('Error creating service:', error.message);
    return reply.code(500).send({ message: 'Failed to create service' });
}
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
    // await prisma.sliTarget.create({ data: sli });
    try {
      await prisma.sliTarget.create({ data: sli });
    } catch (error) {
      console.error(`Failed to create SLI for service ${serviceId}, metric ${sli.metric}:`, error.message);
    }
  }
}
