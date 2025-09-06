"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.servicesRoutes = servicesRoutes;
const services_1 = require("../../Controllers/APIs/services");
const addServices_1 = require("../../Controllers/APIs/addServices");
const deleteServices_1 = require("../../Controllers/APIs/deleteServices");
async function servicesRoutes(fastify) {
    // 📌 ROTA: GET /api/services - Listar todos os serviços
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
    // 📌 ROTA: POST /api/addServices/:ownerId - Criar novo serviço
    fastify.post('/api/addServices/:ownerId', {
        schema: {
            description: 'Adicionar novo serviço',
            tags: ['Services'],
            params: {
                type: 'object',
                properties: {
                    ownerId: { type: 'string', description: 'ID do usuário dono do serviço' }
                },
                required: ['ownerId']
            },
            body: {
                type: 'object',
                required: ['name', 'type', 'target'],
                properties: {
                    name: { type: 'string', description: 'Nome do serviço' },
                    type: {
                        type: 'string',
                        enum: ['HTTP', 'PING', 'SNMP', 'WEBHOOK'],
                        description: 'Tipo de serviço a ser monitorado'
                    },
                    target: { type: 'string', description: 'Endereço ou destino do serviço' }
                }
            },
            response: {
                201: {
                    description: 'Serviço criado com sucesso',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        type: { type: 'string' },
                        target: { type: 'string' },
                        ownerId: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    }
                },
                400: {
                    description: 'Erro ao criar serviço',
                    type: 'object',
                    properties: {
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, addServices_1.addService);
    // 📌 ROTA: DELETE /api/deleteService/:ownerId/:serviceId - Deletar um serviço
    fastify.delete('/api/deleteService/:ownerId/:serviceId', {
        schema: {
            description: 'Deleta um serviço pertencente a um usuário',
            tags: ['Services'],
            params: {
                type: 'object',
                required: ['ownerId', 'serviceId'],
                properties: {
                    ownerId: { type: 'string', description: 'ID do dono do serviço' },
                    serviceId: { type: 'string', description: 'ID do serviço a ser deletado' }
                }
            },
            response: {
                200: {
                    description: 'Serviço deletado com sucesso',
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        type: { type: 'string' },
                        target: { type: 'string' },
                        ownerId: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                404: {
                    description: 'Serviço não encontrado ou não pertence ao usuário',
                    type: 'object',
                    properties: {
                        message: { type: 'string' }
                    }
                },
                500: {
                    description: 'Erro interno ao tentar deletar o serviço',
                    type: 'object',
                    properties: {
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, deleteServices_1.deleteService);
}
