import { Point } from '@influxdata/influxdb-client';
import { writeApi } from "../influxdb"

export function writeSnmpMetrics(serviceId: string, data: any)
{
  const point = new Point('snmp_metrics')
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
    data.interfaces.forEach((iface: any, i: number) => {
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