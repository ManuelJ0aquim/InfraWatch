"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailProvider = void 0;
/// <reference types="node" />
const nodemailer_1 = __importDefault(require("nodemailer"));
const alertTemplate_1 = require("../HTML/alertTemplate");
const resetCodeTemplate_1 = require("../HTML/resetCodeTemplate");
class EmailProvider {
    constructor() {
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;
        if (!user || !pass) {
            console.warn('[EmailProvider] Variáveis EMAIL_USER / EMAIL_PASS ausentes. Envios irão falhar.');
        }
        this.transporter = nodemailer_1.default.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: user && pass ? { user, pass } : undefined,
        });
    }
    async sendNotification(to, message, options) {
        if (!to || !/\S+@\S+\.\S+/.test(to)) {
            throw new Error('Email inválido');
        }
        if (!this.transporter) {
            throw new Error('Transporter de email não inicializado');
        }
        const templateType = options?.metadata?.templateType || 'alert';
        const subject = templateType === 'reset-code'
            ? 'InfraWatch - Código de Redefinição de Senha'
            : (options?.metadata?.subject || 'InfraWatch - Alerta');
        const html = templateType === 'reset-code'
            ? (0, resetCodeTemplate_1.buildResetCodeEmailHtml)(message)
            : (0, alertTemplate_1.buildAlertEmailHtml)(message);
        const info = await this.transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            subject,
            text: message,
            html,
        });
        return info?.messageId;
    }
}
exports.EmailProvider = EmailProvider;
