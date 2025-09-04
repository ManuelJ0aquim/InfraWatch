"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
exports.sendAlert = sendAlert;
const EmailProvider_1 = require("./Email/EmailProvider");
const SlackProvider_1 = require("./Slack/SlackProvider");
const TelegramProvider_1 = require("./Telegram/TelegramProvider");
const TwilioProvider_1 = require("./Twilio/TwilioProvider");
class NotificationController {
    constructor() {
        this.providers = {};
        this.factories = {
            email: () => new EmailProvider_1.EmailProvider(),
            slack: () => new SlackProvider_1.SlackProvider(),
            telegram: () => new TelegramProvider_1.TelegramProvider(),
            twilio: () => new TwilioProvider_1.TwilioProvider(),
        };
        this.metrics = {
            email: { sent: 0, failed: 0 },
            slack: { sent: 0, failed: 0 },
            telegram: { sent: 0, failed: 0 },
            twilio: { sent: 0, failed: 0 },
        };
    }
    getProvider(channel) {
        if (!this.providers[channel]) {
            this.providers[channel] = this.factories[channel]();
        }
        return this.providers[channel];
    }
    updateSuccess(channel) {
        const now = new Date().toISOString();
        this.metrics[channel].sent += 1;
        this.metrics[channel].lastSuccess = now;
    }
    updateFailure(channel, err) {
        const now = new Date().toISOString();
        this.metrics[channel].failed += 1;
        this.metrics[channel].lastFailure = now;
        this.metrics[channel].lastError = err.message;
    }
    async send(channel, to, message, options = {}) {
        const provider = this.getProvider(channel);
        const retry = Math.max(0, options.retry ?? 0);
        const timeoutMs = options.timeout && options.timeout > 0 ? options.timeout : undefined;
        const attemptOnce = async () => {
            if (!timeoutMs)
                return provider.sendNotification(to, message, options);
            return await Promise.race([
                provider.sendNotification(to, message, options),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout ao enviar notificação')), timeoutMs)),
            ]);
        };
        let lastError;
        for (let attempt = 0; attempt <= retry; attempt++) {
            try {
                const messageId = await attemptOnce();
                this.updateSuccess(channel);
                return { channel, to, success: true, messageId, timestamp: new Date().toISOString() };
            }
            catch (err) {
                lastError = err;
                if (attempt < retry)
                    await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
            }
        }
        this.updateFailure(channel, lastError ?? new Error('Falha desconhecida'));
        return { channel, to, success: false, error: lastError, timestamp: new Date().toISOString() };
    }
    async sendWithFallback(channels, to, message, options) {
        const results = [];
        for (const channel of channels) {
            const destination = typeof to === 'string' ? to : (to[channel] ?? '');
            if (!destination) {
                results.push({ channel, to: destination, success: false, error: new Error('Destino não fornecido'), timestamp: new Date().toISOString() });
                continue;
            }
            const result = await this.send(channel, destination, message, options);
            results.push(result);
            if (result.success)
                break;
        }
        return results;
    }
    getMetrics() { return this.metrics; }
    reset() {
        Object.keys(this.metrics).forEach((c) => {
            this.metrics[c] = { sent: 0, failed: 0 };
        });
    }
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
async function sendAlert(channel, to, message) {
    try {
        const result = await exports.notificationController.send(channel, to, message);
        if (result.success)
            console.log(`Alerta enviado via ${channel} para ${to}`);
        else
            console.error(`Falha ao enviar alerta via ${channel} para ${to}: ${result.error?.message}`);
    }
    catch (error) {
        console.error(`Erro ao enviar alerta via ${channel} para ${to}:`, error);
    }
}
