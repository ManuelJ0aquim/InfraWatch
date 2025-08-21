import axios from 'axios';
import { performance } from 'perf_hooks';
import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

export async function CheckHTTP(target: string)
{
  const timings: Record<string, number> = {};
  const startTotal = performance.now();

  try
  {
    const startDNS = performance.now();
    const { address } = await lookup(new URL(target).hostname);
    timings.dnsMs = performance.now() - startDNS;

    const startHTTP = performance.now();
    const res = await axios.get(target, { timeout: 5000, responseType: 'arraybuffer' });
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
    };

  }
  catch (err: any)
  {
    const totalTime = performance.now() - startTotal;
    return {
      status: 'DOWN',
      reason: err.code || err.message,
      totalMs: totalTime
    };
  }
}
