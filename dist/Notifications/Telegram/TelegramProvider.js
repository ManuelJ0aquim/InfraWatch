"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramProvider = void 0;
const axios_1 = __importDefault(require("axios"));
class TelegramProvider {
    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    }
    async sendNotification(to, message) {
        // 'to' aqui é o chat_id (pode ser id do usuário ou grupo)
        const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
        await axios_1.default.post(url, {
            chat_id: to,
            text: message,
        });
    }
}
exports.TelegramProvider = TelegramProvider;
