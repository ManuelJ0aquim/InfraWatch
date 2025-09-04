"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationPolicyRepo = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const FALLBACK = {
    maxRetries: 3,
    retryIntervalMinutes: 2,
    escalateAfterMinutes: 10,
    cooldownMinutes: 15,
    recoveryConfirmations: 2,
    channels: ['email'],
    active: true,
};
class NotificationPolicyRepo {
    static async getEffectivePolicy(serviceId) {
        const specific = await prisma.notificationPolicy.findFirst({
            where: { serviceId, active: true },
            orderBy: { updatedAt: 'desc' }
        });
        if (specific)
            return specific;
        const globalDefault = await prisma.notificationPolicy.findFirst({
            where: { isDefault: true, active: true },
            orderBy: { updatedAt: 'desc' }
        });
        if (globalDefault)
            return globalDefault;
        return {
            id: 'fallback',
            serviceId: null,
            isDefault: false,
            active: true,
            channels: FALLBACK.channels,
            maxRetries: FALLBACK.maxRetries,
            retryIntervalMinutes: FALLBACK.retryIntervalMinutes,
            escalateAfterMinutes: FALLBACK.escalateAfterMinutes,
            cooldownMinutes: FALLBACK.cooldownMinutes,
            recoveryConfirmations: FALLBACK.recoveryConfirmations,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
}
exports.NotificationPolicyRepo = NotificationPolicyRepo;
