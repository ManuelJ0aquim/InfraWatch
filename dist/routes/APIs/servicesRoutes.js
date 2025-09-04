"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.servicesRoutes = servicesRoutes;
const services_1 = require("../../Controllers/APIs/services");
async function servicesRoutes(fastify) {
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
            const services = await (0, services_1.getAllServices)();
            return services;
        }
        catch (error) {
            request.log.error(error);
            reply.status(500).send({ error: 'Erro ao listar serviços' });
        }
    });
}
