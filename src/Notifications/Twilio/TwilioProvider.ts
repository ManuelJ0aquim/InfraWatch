import { Twilio } from 'twilio';
import { INotificationProvider } from '../INotificationProvider';

export class TwilioProvider implements INotificationProvider
{
  private client: Twilio;
  private fromNumber: string;

  constructor()
  {
    const accountSid = process.env.TWILIO_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (!accountSid || !authToken || !this.fromNumber)
    {
      throw new Error('Twilio credentials or phone number not set in environment variables.');
    }

    this.client = new Twilio(accountSid, authToken);
  }

  async sendNotification(to: string, message: string): Promise<void>
  {
    await this.client.messages.create({
      body: message,
      from: this.fromNumber,
      to,
    });
  }
}
