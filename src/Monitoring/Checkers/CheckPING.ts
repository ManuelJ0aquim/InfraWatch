import ping from 'ping';

export async function CheckPING(target: string, count: number = 4, timeout: number = 5) {
  const times: number[] = [];
  let transmitted = 0;
  let received = 0;

  for (let i = 0; i < count; i++) {
    transmitted++;
    const start = Date.now();
    const res = await ping.promise.probe(target, { timeout });

    if (res.alive) {
      received++;
      times.push(Date.now() - start);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const loss = ((transmitted - received) / transmitted) * 100;
  const min = times.length > 0 ? Math.min(...times) : null;
  const max = times.length > 0 ? Math.max(...times) : null;
  const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : null;

  const mdev = times.length > 0
    ? Math.sqrt(times.map(t => Math.pow(t - (avg || 0), 2)).reduce((a, b) => a + b, 0) / times.length)
    : null;

  return {
    target,
    transmitted,
    received,
    lossPercent: loss,
    minMs: min,
    avgMs: avg,
    maxMs: max,
    mdevMs: mdev,
    status: received > 0 ? 'UP' : 'DOWN'
  };
}
