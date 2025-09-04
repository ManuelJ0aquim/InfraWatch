"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addServiceRoutes = addServiceRoutes;
const addServices_1 = require("../../Controllers/APIs/addServices");
async function addServiceRoutes(fastify) {
    fastify.post('/api/addServices', {
        schema: {
            description: 'Adicionar novo serviço',
            tags: ['Services'],
            body: {
                type: 'object',
                required: ['name', 'type', 'target', 'ownerId'],
                properties: {
                    name: { type: 'string' },
                    type: { type: 'string', enum: ['HTTP', 'PING', 'SNMP', 'WEBHOOK'] },
                    target: { type: 'string' },
                    ownerId: { type: 'string' },
                }
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        type: { type: 'string' },
                        target: { type: 'string' },
                        ownerId: { type: 'string' },
                        createdAt: { type: 'string' },
                        updatedAt: { type: 'string' },
                    }
                }
            }
        }
    }, addServices_1.addService);
}
