"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const EmailProvider_1 = require("../../Notifications/Email/EmailProvider");
const SlackProvider_1 = require("../../Notifications/Slack/SlackProvider");
const TelegramProvider_1 = require("../../Notifications/Telegram/TelegramProvider");
const TwilioProvider_1 = require("../../Notifications/Twilio/TwilioProvider");
class NotificationController {
    constructor() {
        this.providers =
            {
                email: new EmailProvider_1.EmailProvider(),
                slack: new SlackProvider_1.SlackProvider(),
                telegram: new TelegramProvider_1.TelegramProvider(),
                twilio: new TwilioProvider_1.TwilioProvider(),
            };
    }
    async send(channel, to, message) {
        const provider = this.providers[channel];
        if (!provider)
            throw new Error(`Canal ${channel} não suportado`);
        await provider.sendNotification(to, message);
    }
}
exports.NotificationController = NotificationController;
