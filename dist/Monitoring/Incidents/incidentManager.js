"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findOrOpenIncident = findOrOpenIncident;
exports.closeIncidentIfRecovered = closeIncidentIfRecovered;
exports.updateIncidentNotification = updateIncidentNotification;
const client_1 = require("@prisma/client");
const WriteServiceStatus_1 = require("../../Influxdb/WriteMetrics/WriteServiceStatus");
const prisma = new client_1.PrismaClient();
async function findOrOpenIncident(serviceId, reason) {
    let incident = await prisma.incident.findFirst({
        where: { serviceId, closedAt: null },
    });
    if (!incident) {
        incident = await prisma.incident.create({
            data: { serviceId, reason: reason ?? "auto-open" },
        });
    }
    return incident;
}
async function closeIncidentIfRecovered(serviceId, recoveryConfirmations) {
    try {
        const ups = await (0, WriteServiceStatus_1.countRecentUps)(serviceId, 5);
        const openIncidents = await prisma.incident.findMany({
            where: { serviceId, closedAt: null },
        });
        if (openIncidents.length > 0 && ups >= recoveryConfirmations) {
            await prisma.incident.updateMany({
                where: { serviceId, closedAt: null },
                data: { closedAt: new Date(), reason: "auto-recovery" },
            });
        }
    }
    catch (err) {
        console.error(`Erro ao verificar recuperação do serviço ${serviceId}:`, err);
    }
}
async function updateIncidentNotification(incidentId, retryCount) {
    await prisma.incident.update({
        where: { id: incidentId },
        data: { lastNotificationAt: new Date(), retryCount },
    });
}
