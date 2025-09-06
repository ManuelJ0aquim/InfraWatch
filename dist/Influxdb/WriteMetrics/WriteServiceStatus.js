"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeServiceStatus = writeServiceStatus;
exports.countRecentUps = countRecentUps;
const influxdb_client_1 = require("@influxdata/influxdb-client");
const influxdb_1 = require("../../Influxdb/influxdb");
const influxdb_2 = require("../influxdb");
async function writeServiceStatus(params) {
    const { serviceId, status, latency } = params;
    influxdb_2.writeApi.useDefaultTags({ serviceId });
    const point = new influxdb_client_1.Point("service_status")
        .tag("serviceId", serviceId)
        .stringField("status", status)
        .booleanField("isUp", status === "UP")
        .timestamp(new Date());
    if (latency !== undefined) {
        point.floatField("latency_ms", latency);
    }
    influxdb_2.writeApi.writePoint(point);
    try {
        await influxdb_2.writeApi.flush();
    }
    catch (err) {
        console.error("Erro ao gravar status no Influx:", err);
    }
}
async function countRecentUps(serviceId, minutes) {
    const fluxQuery = `
    from(bucket: "${process.env.INFLUX_BUCKET}")
      |> range(start: -${minutes}m)
      |> filter(fn: (r) => r._measurement == "service_status")
      |> filter(fn: (r) => r.serviceId == "${serviceId}")
      |> filter(fn: (r) => r._field == "isUp")
      |> filter(fn: (r) => r._value == true)
      |> count()
  `;
    return new Promise((resolve, reject) => {
        let count = 0;
        influxdb_1.queryApi.queryRows(fluxQuery, {
            next: (row, tableMeta) => {
                const o = tableMeta.toObject(row);
                count = o._value;
            },
            error: reject,
            complete: () => resolve(count),
        });
    });
}
