"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioProvider = void 0;
const twilio_1 = require("twilio");
class TwilioProvider {
    constructor() {
        this.fromNumber = '';
        this.enabled = false;
        const accountSid = process.env.TWILIO_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const from = process.env.TWILIO_PHONE_NUMBER;
        if (accountSid && authToken && from) {
            this.client = new twilio_1.Twilio(accountSid, authToken);
            this.fromNumber = from;
            this.enabled = true;
        }
        else {
            console.warn('[TwilioProvider] Credenciais ausentes: SMS desabilitado.');
        }
    }
    async sendNotification(to, message, options) {
        if (!this.enabled || !this.client) {
            throw new Error('Twilio não configurado');
        }
        if (!/^\+?[1-9]\d{6,14}$/.test(to)) {
            throw new Error('Número de telefone inválido (esperado formato E.164)');
        }
        const statusCallback = process.env.TWILIO_STATUS_CALLBACK || options?.metadata?.statusCallback;
        const res = await this.client.messages.create({
            body: message,
            from: this.fromNumber,
            to,
            statusCallback,
        });
        return res?.sid;
    }
}
exports.TwilioProvider = TwilioProvider;
