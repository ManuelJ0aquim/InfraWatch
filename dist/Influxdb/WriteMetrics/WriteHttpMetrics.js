"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeHttpMetrics = writeHttpMetrics;
const influxdb_client_1 = require("@influxdata/influxdb-client");
const influxdb_1 = require("../influxdb");
function writeHttpMetrics(serviceId, data) {
    const point = new influxdb_client_1.Point("http_metrics")
        .tag("serviceId", serviceId)
        .stringField("status", data.status ?? "")
        .intField("httpStatus", data.httpStatus ?? 0)
        .stringField("ip", data.ip ?? "")
        .intField("sizeBytes", data.sizeBytes ?? 0)
        .floatField("dnsMs", data.dnsMs ?? 0)
        .floatField("connectAndDownloadMs", data.connectAndDownloadMs ?? 0)
        .floatField("totalMs", data.totalMs ?? 0)
        .timestamp(new Date());
    if (data.headers) {
        Object.entries(data.headers).forEach(([key, value]) => {
            const headerPoint = new influxdb_client_1.Point("service_http_header")
                .tag("serviceId", serviceId)
                .tag("header", key)
                .stringField("value", String(value))
                .timestamp(new Date());
            influxdb_1.writeApi.writePoint(headerPoint);
        });
    }
    influxdb_1.writeApi.writePoint(point);
    influxdb_1.writeApi.flush();
}
