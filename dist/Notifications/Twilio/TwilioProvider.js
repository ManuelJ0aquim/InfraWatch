"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioProvider = void 0;
const twilio_1 = require("twilio");
class TwilioProvider {
    constructor() {
        const accountSid = process.env.TWILIO_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
        if (!accountSid || !authToken || !this.fromNumber) {
            throw new Error('Twilio credentials or phone number not set in environment variables.');
        }
        this.client = new twilio_1.Twilio(accountSid, authToken);
    }
    async sendNotification(to, message) {
        await this.client.messages.create({
            body: message,
            from: this.fromNumber,
            to,
        });
    }
}
exports.TwilioProvider = TwilioProvider;
