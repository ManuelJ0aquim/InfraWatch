"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackProvider = void 0;
const axios_1 = __importDefault(require("axios"));
class SlackProvider {
    constructor() {
        this.enabled = false;
        this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
        if (!this.webhookUrl) {
            console.warn('[SlackProvider] SLACK_WEBHOOK_URL ausente: Slack desabilitado.');
        }
        else {
            this.enabled = true;
        }
    }
    async sendNotification(to, message, _options) {
        if (!this.enabled || !this.webhookUrl) {
            throw new Error('Slack não configurado');
        }
        if (!to || !to.startsWith('#')) {
            // Permite também canal direto? Poderia validar @user, aqui exigimos canal #
            console.warn('[SlackProvider] Destino não começa com #, prosseguindo mesmo assim.');
        }
        await axios_1.default.post(this.webhookUrl, {
            channel: to,
            text: message,
        });
        return undefined;
    }
}
exports.SlackProvider = SlackProvider;
