import ping from 'ping';

export async function CheckPING(target: string, count: number = 4, timeout: number = 5)
{
  const times: number[] = [];
  let transmitted = 0;
  let received = 0;

  for (let i = 0; i < count; i++)
  {
    transmitted++;
    const start = Date.now();
    const res = await ping.promise.probe(target, { timeout });

    if (res.alive)
    {
      received++;
      times.push(Date.now() - start);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const loss = ((transmitted - received) / transmitted) * 100;

  const min = times.length > 0 ? Math.min(...times) : 0;
  const max = times.length > 0 ? Math.max(...times) : 0;
  const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

  const mdev = times.length > 0
    ? Math.sqrt(times.map(t => Math.pow(t - avg, 2)).reduce((a, b) => a + b, 0) / times.length)
    : 0;

  return {
    target,
    packets_transmitted: transmitted,    
    packets_received: received,          
    percent_packet_loss: loss,           
    minimum_response_ms: min,           
    maximum_response_ms: max,
    average_response_ms: avg,
    standard_deviation_ms: mdev,
    ttl: null,
    status: received > 0 ? 'UP' : 'DOWN'
  };
}
