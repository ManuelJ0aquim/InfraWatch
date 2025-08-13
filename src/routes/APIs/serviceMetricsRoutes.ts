import { FastifyInstance } from 'fastify';
import { getSnmpMetrics, getHttpMetrics, getWebhookMetrics, getPingMetrics } from '../../Controllers/APIs/serviceMetrics';

export async function serviceMetricsRoutes(fastify: FastifyInstance)
{
  // SNMP
  fastify.get('/api/services/:id/metrics/snmp', {
    schema: {
      description: 'Obter métricas SNMP do serviço pela última hora',
      tags: ['Services'],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      return await getSnmpMetrics(id);
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Erro ao buscar métricas SNMP' });
    }
  });

  // HTTP
  fastify.get('/api/services/:id/metrics/http', {
    schema: {
      description: 'Obter métricas HTTP do serviço pela última hora',
      tags: ['Services'],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      return await getHttpMetrics(id);
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Erro ao buscar métricas HTTP' });
    }
  });

  // Webhook
  fastify.get('/api/services/:id/metrics/webhook', {
    schema: {
      description: 'Obter métricas Webhook do serviço pela última hora',
      tags: ['Services'],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      return await getWebhookMetrics(id);
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Erro ao buscar métricas Webhook' });
    }
  });

  // Ping
  fastify.get('/api/services/:id/metrics/ping', {
    schema: {
      description: 'Obter métricas de PING do serviço pela última hora',
      tags: ['Services'],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const metrics = await getPingMetrics(id);
      return metrics;
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Erro ao buscar métricas PING' });
    }
  });
}
