"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRoutes = notificationRoutes;
const Notification_1 = require("../../Controllers/APIs/Notification");
const controller = new Notification_1.NotificationController();
async function notificationRoutes(fastify) {
    fastify.post('/api/notifications/send', {
        schema: {
            description: 'Enviar notificação por canal',
            tags: ['Notifications'],
            body: {
                type: 'object',
                required: ['channel', 'to', 'message'],
                properties: {
                    channel: { type: 'string', enum: ['email', 'slack', 'telegram', 'twilio'] },
                    to: { type: 'string' },
                    message: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { channel, to, message } = request.body;
            await controller.send(channel, to, message);
            return { success: true };
        }
        catch (error) {
            request.log.error(error);
            reply.status(500).send({ error: 'Erro ao enviar notificação' });
        }
    });
}
