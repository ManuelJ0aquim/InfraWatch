"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writePingMetrics = writePingMetrics;
const influxdb_client_1 = require("@influxdata/influxdb-client");
const influxdb_1 = require("../influxdb");
function writePingMetrics(serviceId, metrics) {
    const point = new influxdb_client_1.Point('ping_metrics')
        .tag('serviceId', serviceId)
        .floatField('percent_packet_loss', metrics.percent_packet_loss)
        .floatField('minimum_response_ms', metrics.minimum_response_ms)
        .floatField('maximum_response_ms', metrics.maximum_response_ms)
        .floatField('average_response_ms', metrics.average_response_ms)
        .floatField('standard_deviation_ms', metrics.standard_deviation_ms)
        .intField('packets_transmitted', metrics.packets_transmitted)
        .intField('packets_received', metrics.packets_received)
        .intField('result_code', metrics.result_code ?? 0)
        .intField('ttl', metrics.ttl ?? 0)
        .stringField('status', metrics.status);
    influxdb_1.writeApi.writePoint(point);
    influxdb_1.writeApi.flush();
}
