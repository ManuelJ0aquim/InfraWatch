import { EmailProvider } from '../../Notifications/Email/EmailProvider';
import { SlackProvider } from '../../Notifications/Slack/SlackProvider';
import { TelegramProvider } from '../../Notifications/Telegram/TelegramProvider';
import { TwilioProvider } from '../../Notifications/Twilio/TwilioProvider';
import { INotificationProvider } from '../../Notifications/INotificationProvider';

type Channel = 'email' | 'slack' | 'telegram' | 'twilio';

export class NotificationController {
  private providers: Record<Channel, INotificationProvider>;

  constructor() {
    this.providers = {
      email: new EmailProvider(),
      slack: new SlackProvider(),
      telegram: new TelegramProvider(),
      twilio: new TwilioProvider(),
    };
  }

  async send(channel: Channel, to: string, message: string) {
    const provider = this.providers[channel];
    if (!provider) throw new Error(`Canal ${channel} não suportado`);
    await provider.sendNotification(to, message);
  }
}
