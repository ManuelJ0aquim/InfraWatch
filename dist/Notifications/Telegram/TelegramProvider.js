"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramProvider = void 0;
const axios_1 = __importDefault(require("axios"));
class TelegramProvider {
    constructor() {
        this.enabled = false;
        this.botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!this.botToken) {
            console.warn('[TelegramProvider] TELEGRAM_BOT_TOKEN ausente: Telegram desabilitado.');
        }
        else {
            this.enabled = true;
        }
    }
    async sendNotification(to, message, options) {
        if (!this.enabled || !this.botToken) {
            throw new Error('Telegram não configurado');
        }
        if (!to) {
            throw new Error('Chat ID vazio');
        }
        const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
        const res = await axios_1.default.post(url, {
            chat_id: to,
            text: message,
            parse_mode: options?.metadata?.parseMode,
        });
        return res?.data?.result?.message_id?.toString();
    }
}
exports.TelegramProvider = TelegramProvider;
