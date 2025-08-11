import axios from 'axios';
import { INotificationProvider } from '../INotificationProvider';

export class SlackProvider implements INotificationProvider
{
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
  }

  async sendNotification(to: string, message: string): Promise<void>
  {
    await axios.post(this.webhookUrl, {
      channel: to,
      text: message,
    });
  }
}
