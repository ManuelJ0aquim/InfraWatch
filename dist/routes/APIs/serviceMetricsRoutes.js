"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceMetricsRoutes = serviceMetricsRoutes;
const serviceMetrics_1 = require("../../Controllers/APIs/serviceMetrics");
async function serviceMetricsRoutes(fastify) {
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
            const { id } = request.params;
            return await (0, serviceMetrics_1.getSnmpMetrics)(id);
        }
        catch (error) {
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
            const { id } = request.params;
            return await (0, serviceMetrics_1.getHttpMetrics)(id);
        }
        catch (error) {
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
            const { id } = request.params;
            return await (0, serviceMetrics_1.getWebhookMetrics)(id);
        }
        catch (error) {
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
            const { id } = request.params;
            const metrics = await (0, serviceMetrics_1.getPingMetrics)(id);
            return metrics;
        }
        catch (error) {
            request.log.error(error);
            reply.status(500).send({ error: 'Erro ao buscar métricas PING' });
        }
    });
}
