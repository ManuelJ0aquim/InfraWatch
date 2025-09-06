"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addService = addService;
const client_1 = require("@prisma/client");
async function addService(request, reply) {
    const { ownerId } = request.params;
    const { name, type, target } = request.body;
    console.log(ownerId);
    const service = await request.server.prisma.service.create({
        data: { name, type, target, ownerId }
    });
    await createDefaultSLIsForService(service.id, type, request.server.prisma);
    return reply.code(201).send(service);
}
async function createDefaultSLIsForService(serviceId, type, prisma) {
    const defaultSLIs = [];
    switch (type) {
        case client_1.ServiceType.PING:
            defaultSLIs.push({
                serviceId,
                metric: 'PING',
                threshold: 98,
                comparison: 'gte',
            });
            break;
        case client_1.ServiceType.HTTP:
            defaultSLIs.push({
                serviceId,
                metric: 'HTTP',
                threshold: 98,
                comparison: 'gte',
            });
            break;
        case client_1.ServiceType.SNMP:
            defaultSLIs.push({
                serviceId,
                metric: 'SNMP',
                threshold: 95,
                comparison: 'gte',
            });
            break;
    }
    for (const sli of defaultSLIs) {
        await prisma.sliTarget.create({ data: sli });
    }
}
