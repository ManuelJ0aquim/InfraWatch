import axios from 'axios';
import { performance } from 'perf_hooks';
import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

interface WebhookCheckResult {
  status: 'UP' | 'DOWN';
  httpStatus?: number;
  ip?: string;
  sizeBytes?: number;
  dnsMs?: number;
  connectAndDownloadMs?: number;
  totalMs: number;
  headers?: Record<string, any>;
  reason?: string;
  payloadSent?: any;
  responseBody?: string;
}

export async function CheckWebhook( url: string, payload: any = { ping: true }, timeout: number = 5000 ): Promise<WebhookCheckResult>
{
  const timings: Record<string, number> = {};
  const startTotal = performance.now();

  try
  {
    const startDNS = performance.now();
    const { address } = await lookup(new URL(url).hostname);
    timings.dnsMs = performance.now() - startDNS;

    const startHTTP = performance.now();
    const res = await axios.post(url, payload, {
      timeout,
      responseType: 'arraybuffer'
    });
    timings.httpMs = performance.now() - startHTTP;

    const totalTime = performance.now() - startTotal;

    return {
      status: res.status >= 200 && res.status < 300 ? 'UP' : 'DOWN',
      httpStatus: res.status,
      ip: address,
      sizeBytes: res.data.length,
      dnsMs: timings.dnsMs,
      connectAndDownloadMs: timings.httpMs,
      totalMs: totalTime,
      headers: res.headers,
      payloadSent: payload,
      responseBody: res.data.toString()
    };

  }
  catch (err: any)
  {
    const totalTime = performance.now() - startTotal;
    return {
      status: 'DOWN',
      reason: err.code || err.message,
      totalMs: totalTime,
      payloadSent: payload
    };
  }
}
