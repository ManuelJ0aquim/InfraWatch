import { queryApi } from '../../influxdb';

export async function queryMetrics(serviceId: string, measurement: string)
{
  const query = `
    from(bucket: "${process.env.INFLUX_BUCKET}")
      |> range(start: -1m)
      |> filter(fn: (r) => r._measurement == "${measurement}" and r.serviceId == "${serviceId}")
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"])
  `;

  try
  {
    const rows = await queryApi.collectRows(query);
    return rows;
  }
  catch (error)
  {
    throw new Error(`Erro na consulta InfluxDB: ${error.message}`);
  }
}

export async function getPingMetrics(serviceId: string)
{
  try
  {
    const rows = await queryMetrics(serviceId, 'ping_metrics');
    const formattedRows = rows.map(row => ({
      time: row._time,
      lossPercent: row.lossPercent || 0,
      minMs: row.minMs || 0,
      avgMs: row.avgMs || 0,
      maxMs: row.maxMs || 0,
      mdevMs: row.mdevMs || 0,
      status: row.status || 'unknown',
      transmitted: row.transmitted || 0,
      received: row.received || 0,
    }));
    return formattedRows;
  }
  catch (error) {
    throw error;
  }
}

export async function getSnmpMetrics(serviceId: string)
{
  try
  {
    const rows = await queryMetrics(serviceId, 'snmp_metrics');
    const formattedRows = rows.map(row => ({
      time: row._time,
      sysName: row.sysName || '',
      sysDescr: row.sysDescr || '',
      uptime: row.uptime || '',
      cpuLoad1min: row.cpuLoad1min || 0,
      memTotalKB: row.memTotalKB || 0,
      memAvailKB: row.memAvailKB || 0,
      interfacesCount: row.interfacesCount || 0,
    }));
    return formattedRows;
  }
  catch (error)
  {
    throw error;
  }
}

export async function getHttpMetrics(serviceId: string)
{
  try
  {
    const rows = await queryMetrics(serviceId, 'http_metrics');
    
    const formattedRows = rows.map(row => ({
      time: row._time,
      status: row.status || 'unknown',
      httpStatus: row.httpStatus || 0,
      ip: row.ip || '',
      sizeBytes: row.sizeBytes || 0,
      dnsMs: row.dnsMs || 0,
      connectAndDownloadMs: row.connectAndDownloadMs || 0,
      totalMs: row.totalMs || 0,
      headers: row.headers ? (typeof row.headers === 'string' ? JSON.parse(row.headers) : row.headers) : {},
    }));
    return formattedRows;
  }
  catch (error)
  {
    throw new Error(`Erro ao buscar métricas HTTP: ${error.message}`);
  }
}

export async function getWebhookMetrics(serviceId: string)
{
  try
  {
    const rows = await queryMetrics(serviceId, 'webhook_metrics');
    const formattedRows = rows.map(row => (
    {
      time: row._time,
      statusCode: row.statusCode || 0,
      responseTimeMs: row.responseTimeMs || 0,
      status: row.status || 'unknown',
    }));
    return formattedRows;
  }
  catch (error)
  {
    throw error;
  }
}