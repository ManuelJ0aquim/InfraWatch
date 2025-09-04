"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeMetric = writeMetric;
const influxdb_client_1 = require("@influxdata/influxdb-client");
const influxdb_1 = require("../influxdb");
function writeMetric(serviceId, status) {
    const point = new influxdb_client_1.Point('service_status')
        .tag('serviceId', serviceId)
        .stringField('status', status)
        .timestamp(new Date());
    influxdb_1.writeApi.writePoint(point);
    influxdb_1.writeApi.flush();
}
