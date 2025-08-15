import { detectIssues} from "./utils_worker2";
import { NotificationController } from '../../Controllers/APIs/Notification';

const notificationController = new NotificationController();

// const alertContacts = [
//   { channel: 'email', to: 'marquessanches007@gmail.com' },
//   { channel: 'twilio', to: '+244925560046' }
//   { channel: 'telegram', to: '123456789' },
//   { channel: 'slack', to: '#alertas' },
// ];

async function sendAlert(channel: 'email' | 'slack' | 'telegram' | 'twilio', to: string, message: string)
{
    try
    {
      await notificationController.send(channel, to, message);
      console.log(`Alerta enviado via ${channel} para ${to}`);
    }
    catch (error)
    {
      console.error(`Erro ao enviar alerta via ${channel} para ${to}:`, error);
    }
}

export async function checkServices()
{
    const issues = await detectIssues();

    let size = issues.length;
    let i = 0;

    if (size === 0)
    {
      console.log('Todos os serviços estão operando normalmente.');
      return;
    }
    console.log(issues);
    while (i < size)
    {
      const issue = issues[i];
      const message = `Serviço ${issue.serviceName} está com problema: ${issue.description}`;

      // let j = 0;
      // while (j < alertContacts.length)
      // {
      //   const contact = alertContacts[j];
      //   await sendAlert(contact.channel as any, contact.to, message);
      //   j++;
      // }
      i++;
    }
}