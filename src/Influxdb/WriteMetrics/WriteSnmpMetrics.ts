import { Point } from "@influxdata/influxdb-client";
import { writeApi } from "../influxdb";

export async function writeSnmpMetrics(serviceId: string, data: any)
{
  const point = new Point("snmp_metrics")
    .tag("serviceId", serviceId)
    .tag("ip", data.ip)
    .stringField("sysName", data.sysName ?? "")
    .stringField("sysDescr", data.metrics.sysDescr ?? "")
    .stringField("uptime", data.metrics.sysUpTime ?? "")
    .floatField("cpu5Sec", parseFloat(data.metrics.cpu5Sec ?? "0"))
    .floatField("cpu5Min", parseFloat(data.metrics.cpu5Min ?? "0"))
    .intField("memFree", parseInt(data.metrics.memFree ?? "0"))
    .intField("memUsed", parseInt(data.metrics.memUsed ?? "0"))
    .stringField("ifOperStatus", data.metrics.ifOperStatus ?? "")
    .stringField("interfaces", JSON.stringify(data.interfaces ?? {}))
    .timestamp(new Date(data.timestamp));

  writeApi.writePoint(point);
  await writeApi.flush();
}
