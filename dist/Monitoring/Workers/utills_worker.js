"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkServices = checkServices;
const utils_worker2_1 = require("./utils_worker2");
const Notification_1 = require("../../Controllers/APIs/Notification");
const notificationController = new Notification_1.NotificationController();
const alertContacts = [
    { channel: 'email', to: 'marquessanches007@gmail.com' },
    // { channel: 'twilio', to: '+244925560046' }
    // { channel: 'telegram', to: '123456789' },
    // { channel: 'slack', to: '#alertas' },
];
async function sendAlert(channel, to, message) {
    try {
        await notificationController.send(channel, to, message);
        console.log(`Alerta enviado via ${channel} para ${to}`);
    }
    catch (error) {
        console.error(`Erro ao enviar alerta via ${channel} para ${to}:`, error);
    }
}
async function checkServices() {
    const issues = await (0, utils_worker2_1.detectIssues)();
    let size = issues.length;
    let i = 0;
    if (size === 0) {
        console.log('Todos os serviços estão operando normalmente.');
        return;
    }
    // console.log(issues);
    while (i < size) {
        const issue = issues[i];
        const message = `Serviço ${issue.serviceName} está com problema: ${issue.description}`;
        let j = 0;
        while (j < alertContacts.length) {
            const contact = alertContacts[j];
            await sendAlert(contact.channel, contact.to, message);
            j++;
        }
        i++;
    }
}
