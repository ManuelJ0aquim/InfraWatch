"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incidentRoutes = incidentRoutes;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const incidentSchema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        serviceId: { type: 'string' },
        openedAt: { type: 'string', format: 'date-time' },
        closedAt: { type: 'string', format: 'date-time', nullable: true },
        reason: { type: 'string', nullable: true },
        service: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
            },
        },
    },
};
async function incidentRoutes(app) {
    app.get('/open', {
        schema: {
            tags: ['Incidents'],
            summary: 'Listar incidentes abertos',
            response: {
                200: { type: 'array', items: incidentSchema },
            },
        },
        handler: async () => {
            return prisma.incident.findMany({
                where: { closedAt: null },
                orderBy: { openedAt: 'desc' },
                include: { service: true },
            });
        },
    });
    app.get('/history', {
        schema: {
            tags: ['Incidents'],
            summary: 'Histórico de incidentes',
            querystring: {
                type: 'object',
                properties: {
                    serviceId: { type: 'string' },
                },
            },
            response: {
                200: { type: 'array', items: incidentSchema },
            },
        },
        handler: async (req) => {
            const { serviceId } = req.query;
            return prisma.incident.findMany({
                where: { serviceId: serviceId || undefined },
                orderBy: { openedAt: 'desc' },
                include: { service: true },
            });
        },
    });
    app.post('/:id/close', {
        schema: {
            tags: ['Incidents'],
            summary: 'Fechar incidente manualmente',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
            response: {
                200: incidentSchema,
            },
        },
        handler: async (req) => {
            const { id } = req.params;
            return prisma.incident.update({
                where: { id },
                data: { closedAt: new Date(), reason: 'manual-close' },
                include: { service: true },
            });
        },
    });
}
