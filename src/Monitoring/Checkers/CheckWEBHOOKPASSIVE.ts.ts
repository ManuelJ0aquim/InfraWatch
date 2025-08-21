export interface WebhookPassiveResult
{
    status: string;
    totalMs: number;
    httpStatus: number | null;
    description: string;
  
    ip?: string;
    sizeBytes?: number;
    dnsMs?: number;
    connectAndDownloadMs?: number;
    headers?: Record<string, string | number | boolean>;
    payloadSent?: any;
    responseBody?: any;
  }
  
  export function CheckWebhookPassive(payload: any): WebhookPassiveResult
  {
    const status =
      payload?.status === "UP" || payload?.status === "DOWN"
        ? payload.status
        : "UNKNOWN";
  
    return {
      status,
      totalMs: payload?.durationMs ?? payload?.totalMs ?? 0,
      httpStatus: payload?.httpStatus ?? null,
      description: payload?.msg ?? "",
      ip: payload?.ip ?? "",
      sizeBytes: payload?.sizeBytes ?? 0,
      dnsMs: payload?.dnsMs ?? 0,
      connectAndDownloadMs: payload?.connectAndDownloadMs ?? 0,
      headers: payload?.headers ?? {},
      payloadSent: payload?.payloadSent ?? payload ?? {},
      responseBody: payload?.responseBody ?? "",
    };
  }
  
  