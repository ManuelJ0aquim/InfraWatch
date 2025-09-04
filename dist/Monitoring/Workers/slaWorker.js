"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.processSlaAndAlerts = processSlaAndAlerts;
const client_1 = require("@prisma/client");
const socket_1 = require("../../socket");
const WriteSlaRecord_1 = require("../../Influxdb/WriteMetrics/WriteSlaRecord");
const WriteServiceStatus_1 = require("../../Influxdb/WriteMetrics/WriteServiceStatus");
const Notification_1 = require("../../Notifications/Notification");
const notificationPolicyRepo_1 = require("../../Repositories/notificationPolicyRepo");
const incidentManager_1 = require("../Incidents/incidentManager");
exports.prisma = new client_1.PrismaClient();
function minutesAgo(date, minutes) {
    return new Date(Date.now() - minutes * 60 * 1000) > date;
}
async function notifyContacts(serviceId, message, channels) {
    const contacts = await exports.prisma.alertContact.findMany({
        where: { serviceId, active: true },
    });
    for (const c of contacts) {
        if (channels.length === 0 || channels.includes(c.channel)) {
            await (0, Notification_1.sendAlert)(c.channel, c.to, message);
        }
    }
}
async function processSlaAndAlerts(serviceId, issues = []) {
    const io = (0, socket_1.getIO)();
    const downNow = issues.length > 0;
    if (downNow) {
        for (const issue of issues) {
            await (0, WriteServiceStatus_1.writeServiceStatus)({
                serviceId: issue.serviceId,
                status: "DOWN",
            });
            const policy = await notificationPolicyRepo_1.NotificationPolicyRepo.getEffectivePolicy(issue.serviceId);
            const incident = await (0, incidentManager_1.findOrOpenIncident)(issue.serviceId);
            if (!incident) {
                console.error(`Falha ao criar ou obter incidente para serviço ${issue.serviceId}`);
                continue;
            }
            await (0, WriteSlaRecord_1.writeSlaRecordToInflux)({
                serviceId: issue.serviceId,
                serviceName: issue.serviceName,
                metric: "availability",
                value: 0,
                status: false,
                criticality: issue.severity,
            });
            const canNotify = !incident.lastNotificationAt ||
                minutesAgo(incident.lastNotificationAt, policy.cooldownMinutes);
            if (canNotify) {
                const nextRetry = (incident.retryCount ?? 0) + 1;
                await notifyContacts(issue.serviceId, `ALERTA ${issue.severity.toUpperCase()}: ${issue.serviceName} - ${issue.description} (retry ${nextRetry}/${policy.maxRetries})`, policy.channels);
                await (0, incidentManager_1.updateIncidentNotification)(incident.id, nextRetry);
            }
            io.emit("slaViolation", {
                serviceId: issue.serviceId,
                serviceName: issue.serviceName,
                description: issue.description,
                severity: issue.severity,
            });
        }
    }
    else {
        await (0, WriteServiceStatus_1.writeServiceStatus)({ serviceId, status: "UP" });
        const policy = await notificationPolicyRepo_1.NotificationPolicyRepo.getEffectivePolicy(serviceId);
        await (0, incidentManager_1.closeIncidentIfRecovered)(serviceId, policy.recoveryConfirmations);
    }
}
