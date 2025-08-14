export interface INotificationProvider
{
    sendNotification(to: string, message: string): Promise<void>;
}
  