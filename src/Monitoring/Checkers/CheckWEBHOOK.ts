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
}

export async function CheckWebhook(
  url: string,
  payload: any = { ping: true }, // Payload padrão
  timeout: number = 5000
): Promise<WebhookCheckResult> {
  
  const timings: Record<string, number> = {};
  const startTotal = performance.now();

  try {
    // 🔹 1. Resolver DNS
    const startDNS = performance.now();
    const { address } = await lookup(new URL(url).hostname);
    timings.dnsMs = performance.now() - startDNS;

    // 🔹 2. Enviar POST e medir tempo
    const startHTTP = performance.now();
    const res = await axios.post(url, payload, {
      timeout,
      responseType: 'arraybuffer' // Permite medir tamanho real da resposta
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
      headers: res.headers
    };

  } catch (err: any) {
    const totalTime = performance.now() - startTotal;
    return {
      status: 'DOWN',
      reason: err.code || err.message,
      totalMs: totalTime
    };
  }
}
