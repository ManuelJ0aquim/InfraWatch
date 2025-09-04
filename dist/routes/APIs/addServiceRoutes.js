"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addServiceRoutes = addServiceRoutes;
const addServices_1 = require("../../Controllers/APIs/addServices");
async function addServiceRoutes(fastify) {
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
}
