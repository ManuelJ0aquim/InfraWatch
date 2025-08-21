import { FastifyInstance } from 'fastify';
import { getAllServices } from '../../Controllers/APIs/services';

export async function servicesRoutes(fastify: FastifyInstance)
{
  fastify.get('/api/services', {
    schema: {
      description: 'Lista todos os serviços',
      tags: ['Services'],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              target: { type: 'string' },
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const services = await getAllServices();
      return services;
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Erro ao listar serviços' });
    }
  });
}
