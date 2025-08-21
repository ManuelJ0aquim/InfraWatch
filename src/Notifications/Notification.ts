import { EmailProvider } from './Email/EmailProvider';
import { SlackProvider } from './Slack/SlackProvider';
import { TelegramProvider } from './Telegram/TelegramProvider';
import { TwilioProvider } from './Twilio/TwilioProvider';
import { INotificationProvider } from './INotificationProvider';

type Channel = 'email' | 'slack' | 'telegram' | 'twilio';

export class NotificationController
{
  private providers: Record<Channel, INotificationProvider>;

  constructor()
  {
    this.providers =
    {
      email: new EmailProvider(),
      slack: new SlackProvider(),
      telegram: new TelegramProvider(),
      twilio: new TwilioProvider(),
    };
  }

  async send(channel: Channel, to: string, message: string)
  {
    const provider = this.providers[channel];
    if (!provider) throw new Error(`Canal ${channel} não suportado`);
    await provider.sendNotification(to, message);
  }
}

const notificationController = new NotificationController();

export async function sendAlert(channel: 'email' | 'slack' | 'telegram' | 'twilio', to: string, message: string)
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



