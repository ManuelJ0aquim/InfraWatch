import { FastifyRequest, FastifyReply } from 'fastify';
import { ServiceType } from '@prisma/client';

export async function addService(request: FastifyRequest, reply: FastifyReply)
{
  const {
    name,
    type,
    target,
    ownerId,
  } = request.body as {
    name: string;
    type: ServiceType;
    target: string;
    ownerId: string;
  };

  const userExists = await request.server.prisma.user.findUnique({ where: { id: ownerId } });
  if (!userExists)
  {
    return reply.code(400).send({ message: 'Owner not found' });
  }

  const service = await request.server.prisma.service.create({
    data: {
      name,
      type,
      target,
      ownerId,
    }
  });

  return reply.code(201).send(service);
}