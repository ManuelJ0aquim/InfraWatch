"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailProvider = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailProvider {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            service: 'gmail', // usa o SMTP padrão do Gmail
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }
    async sendNotification(to, message) {
        const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
        <div style="background-color: #0056b3; padding: 20px; text-align: center;">
          <img src="https://cdn-icons-png.flaticon.com/512/565/565547.png" alt="InfraWatch Logo" width="60" style="display: block; margin: 0 auto 10px auto;" />
          <h1 style="color: white; margin: 0; font-size: 24px;">InfraWatch</h1>
        </div>
  
        <div style="padding: 20px; color: #333;">
          <h2 style="color: #0056b3;">🚨 Alerta Importante</h2>
          <p style="font-size: 16px; line-height: 1.5;">
            ${message}
          </p>
  
          <a href="#" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #0056b3; color: white; text-decoration: none; border-radius: 5px; font-weight: 600;">
            Ver detalhes
          </a>
        </div>
  
        <div style="background-color: #f5f5f5; padding: 15px; font-size: 12px; color: #777; text-align: center;">
          <p>Este é um alerta automático enviado pelo sistema InfraWatch. Por favor, não responda este e-mail.</p>
        </div>
      </div>
    `;
        await this.transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject: 'InfraWatch - Alerta',
            text: message,
            html: htmlContent,
        });
    }
    async sendNotification2(to, code) {
        const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
        <div style="background-color: #0056b3; padding: 20px; text-align: center;">
          <img src="https://cdn-icons-png.flaticon.com/512/565/565547.png" alt="InfraWatch Logo" width="60" style="display: block; margin: 0 auto 10px auto;" />
          <h1 style="color: white; margin: 0; font-size: 24px;">InfraWatch</h1>
        </div>

        <div style="padding: 20px; color: #333;">
          <h2 style="color: #0056b3;">🔒 Código de Redefinição de Senha</h2>
          <p style="font-size: 16px; line-height: 1.5;">
            Você solicitou a redefinição de senha. Use o código abaixo para continuar:
          </p>
          <p style="font-size: 24px; font-weight: bold; color: #e63946; text-align: center; margin: 20px 0;">
            ${code}
          </p>
          <p style="font-size: 14px; color: #555;">
            Este código é válido por 15 minutos. Se você não solicitou essa alteração, ignore este e-mail.
          </p>
        </div>

        <div style="background-color: #f5f5f5; padding: 15px; font-size: 12px; color: #777; text-align: center;">
          <p>Este é um e-mail automático enviado pelo sistema InfraWatch. Por favor, não responda este e-mail.</p>
        </div>
      </div>
    `;
        await this.transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject: 'InfraWatch - Código de Redefinição de Senha',
            text: `Seu código de redefinição de senha é: ${code}`,
            html: htmlContent,
        });
    }
}
exports.EmailProvider = EmailProvider;
