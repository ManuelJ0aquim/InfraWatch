import { FastifyInstance } from 'fastify';
import { getServiceMetrics } from '../../Controllers/APIs/serviceMetrics';

export async function serviceMetricsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/services/:id/metrics', {
    schema: {
      description: 'Obter métricas do serviço pela última hora',
      tags: ['Services'],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _time: { type: 'string', format: 'date-time' },
              serviceId: { type: 'string' },
              responseMs: { type: 'integer' },
              status: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const metrics = await getServiceMetrics(id);
      return metrics;
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Erro ao buscar métricas do serviço' });
    }
  });
}
