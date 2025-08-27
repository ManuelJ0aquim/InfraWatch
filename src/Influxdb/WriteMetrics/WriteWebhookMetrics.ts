import { Point } from '@influxdata/influxdb-client';
import { writeApi } from "../influxdb"

export function writeWebhookMetrics(serviceId: string, data: any)
{
  const point = new Point('webhook_metrics')
    .tag('serviceId', serviceId)
    .stringField('status', data.status ?? '')
    .intField('httpStatus', data.httpStatus ?? 0)
    .stringField('ip', data.ip ?? '')
    .intField('sizeBytes', data.sizeBytes ?? 0)
    .floatField('dnsMs', data.dnsMs ?? 0)
    .floatField('connectAndDownloadMs', data.connectAndDownloadMs ?? 0)
    .floatField('totalMs', data.totalMs ?? 0)
    .stringField('payloadSent', JSON.stringify(data.payloadSent ?? {}))
    .stringField('responseBody', data.responseBody ? String(data.responseBody) : '')
    .timestamp(new Date());

  if (data.headers)
  {
    Object.entries(data.headers).forEach(([key, value]) => {
      const headerPoint = new Point('service_webhook_header')
        .tag('serviceId', serviceId)
        .tag('header', key)
        .stringField('value', String(value))
        .timestamp(new Date());

      writeApi.writePoint(headerPoint);
    });
  }

  writeApi.writePoint(point);
  writeApi.flush();
}