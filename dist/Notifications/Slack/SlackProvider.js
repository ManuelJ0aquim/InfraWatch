"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackProvider = void 0;
const axios_1 = __importDefault(require("axios"));
class SlackProvider {
    constructor() {
        this.webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
    }
    async sendNotification(to, message) {
        await axios_1.default.post(this.webhookUrl, {
            channel: to,
            text: message,
        });
    }
}
exports.SlackProvider = SlackProvider;
