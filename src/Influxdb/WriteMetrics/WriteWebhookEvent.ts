import { Point } from "@influxdata/influxdb-client";
import { writeApi } from "../influxdb";

interface WebhookEventPoint
{
  serviceId: string;
  status?: string;   
  sourceIp?: string;
  userAgent?: string;
  signature?: string;
  note?: string;
  payload?: any;  
}

export async function writeWebhookEvent(event: WebhookEventPoint)
{
  const point = new Point("webhook_events")
    .tag("serviceId", event.serviceId);

  if (event.status) point.tag("status", event.status);
  if (event.sourceIp) point.tag("sourceIp", event.sourceIp);

  if (event.userAgent) point.stringField("userAgent", event.userAgent);
  if (event.signature) point.stringField("signature", event.signature);
  if (event.note) point.stringField("note", event.note);

  if (event.payload)
  {
    point.stringField("payload", JSON.stringify(event.payload));
  }

  point.timestamp(new Date());

  writeApi.writePoint(point);
  await writeApi.flush();
}
