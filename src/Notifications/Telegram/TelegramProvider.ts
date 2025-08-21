import axios from 'axios';
import { INotificationProvider } from '../INotificationProvider';

export class TelegramProvider implements INotificationProvider
{
  private botToken: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
  }

  async sendNotification(to: string, message: string): Promise<void>
  {
    // 'to' aqui é o chat_id (pode ser id do usuário ou grupo)
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

    await axios.post(url, {
      chat_id: to,
      text: message,
    });
  }
}
