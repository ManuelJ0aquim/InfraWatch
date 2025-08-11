import { InfluxDB, Point } from '@influxdata/influxdb-client';

const url = process.env.INFLUX_URL!;
const token = process.env.INFLUX_TOKEN!;
const org = process.env.INFLUX_ORG!;
const bucket = process.env.INFLUX_BUCKET!;

const influxDB = new InfluxDB({ url, token });

export const writeApi = influxDB.getWriteApi(org, bucket, 'ms');
export const queryApi = influxDB.getQueryApi(org);

export function writeMetric(serviceId: string, status: string, responseMs: number) {
  const point = new Point('service_status')
    .tag('serviceId', serviceId)
    .stringField('status', status)
    .intField('responseMs', responseMs)
    .timestamp(new Date());

  writeApi.writePoint(point);
  writeApi.flush();
}

export function writeSnmpMetrics(serviceId: string, data: any) {
  const point = new Point('service_snmp')
    .tag('serviceId', serviceId)
    .stringField('sysName', data.sysName ?? '')
    .stringField('sysDescr', data.sysDescr ?? '')
    .stringField('uptime', data.uptime ?? '')
    .floatField('cpuLoad1min', parseFloat(data.cpuLoad1min ?? '0'))
    .intField('memTotalKB', data.memTotalKB ?? 0)
    .intField('memAvailKB', data.memAvailKB ?? 0)
    .intField('interfacesCount', data.interfaces?.length ?? 0)
    .timestamp(new Date());

  if (data.interfaces)
  {
    data.interfaces.forEach((iface: any, i: number) =>
    {
      const ifacePoint = new Point('service_snmp_interface')
        .tag('serviceId', serviceId)
        .tag('interface', iface.description || `iface_${i}`)
        .stringField('status', iface.status || 'unknown')
        .intField('index', parseInt(iface.index, 10) || i)
        .timestamp(new Date());

      writeApi.writePoint(ifacePoint);
    });
  }

  writeApi.writePoint(point);
  writeApi.flush();
}
