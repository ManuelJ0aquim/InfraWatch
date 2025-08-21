"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryApi = exports.writeApi = void 0;
exports.writeMetric = writeMetric;
exports.writePingMetrics = writePingMetrics;
exports.writeSnmpMetrics = writeSnmpMetrics;
exports.writeHttpMetrics = writeHttpMetrics;
exports.writeWebhookMetrics = writeWebhookMetrics;
const influxdb_client_1 = require("@influxdata/influxdb-client");
const url = process.env.INFLUX_URL;
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_BUCKET;
const influxDB = new influxdb_client_1.InfluxDB({ url, token });
exports.writeApi = influxDB.getWriteApi(org, bucket, 'ms');
exports.queryApi = influxDB.getQueryApi(org);
function writeMetric(serviceId, status, responseMs) {
    const point = new influxdb_client_1.Point('service_status')
        .tag('serviceId', serviceId)
        .stringField('status', status)
        .intField('responseMs', responseMs)
        .timestamp(new Date());
    exports.writeApi.writePoint(point);
    exports.writeApi.flush();
}
function writePingMetrics(serviceId, metrics) {
    const point = new influxdb_client_1.Point('ping_metrics')
        .tag('serviceId', serviceId)
        .floatField('lossPercent', metrics.lossPercent)
        .floatField('minMs', metrics.minMs)
        .floatField('avgMs', metrics.avgMs)
        .floatField('maxMs', metrics.maxMs)
        .floatField('mdevMs', metrics.mdevMs)
        .stringField('status', metrics.status)
        .intField('transmitted', metrics.transmitted)
        .intField('received', metrics.received);
    exports.writeApi.writePoint(point);
    exports.writeApi.flush();
}
function writeSnmpMetrics(serviceId, data) {
    const point = new influxdb_client_1.Point('snmp_metrics')
        .tag('serviceId', serviceId)
        .stringField('sysName', data.sysName ?? '')
        .stringField('sysDescr', data.sysDescr ?? '')
        .stringField('uptime', data.uptime ?? '')
        .floatField('cpuLoad1min', parseFloat(data.cpuLoad1min ?? '0'))
        .intField('memTotalKB', data.memTotalKB ?? 0)
        .intField('memAvailKB', data.memAvailKB ?? 0)
        .intField('interfacesCount', data.interfaces?.length ?? 0)
        .timestamp(new Date());
    if (data.interfaces) {
        data.interfaces.forEach((iface, i) => {
            const ifacePoint = new influxdb_client_1.Point('service_snmp_interface')
                .tag('serviceId', serviceId)
                .tag('interface', iface.description || `iface_${i}`)
                .stringField('status', iface.status || 'unknown')
                .intField('index', parseInt(iface.index, 10) || i)
                .timestamp(new Date());
            exports.writeApi.writePoint(ifacePoint);
        });
    }
    exports.writeApi.writePoint(point);
    exports.writeApi.flush();
}
function writeHttpMetrics(serviceId, data) {
    const point = new influxdb_client_1.Point('http_metrics')
        .tag('serviceId', serviceId)
        .stringField('status', data.status ?? '')
        .intField('httpStatus', data.httpStatus ?? 0)
        .stringField('ip', data.ip ?? '')
        .intField('sizeBytes', data.sizeBytes ?? 0)
        .floatField('dnsMs', data.dnsMs ?? 0)
        .floatField('connectAndDownloadMs', data.connectAndDownloadMs ?? 0)
        .floatField('totalMs', data.totalMs ?? 0)
        .timestamp(new Date());
    if (data.headers) {
        Object.entries(data.headers).forEach(([key, value]) => {
            const headerPoint = new influxdb_client_1.Point('service_http_header')
                .tag('serviceId', serviceId)
                .tag('header', key)
                .stringField('value', String(value))
                .timestamp(new Date());
            exports.writeApi.writePoint(headerPoint);
        });
    }
    exports.writeApi.writePoint(point);
    exports.writeApi.flush();
}
function writeWebhookMetrics(serviceId, data) {
    const point = new influxdb_client_1.Point('webhook_metrics')
        .tag('serviceId', serviceId)
        .stringField('status', data.status ?? '')
        .intField('httpStatus', data.httpStatus ?? 0)
        .stringField('ip', data.ip ?? '')
        .intField('sizeBytes', data.sizeBytes ?? 0)
        .floatField('dnsMs', data.dnsMs ?? 0)
        .floatField('connectAndDownloadMs', data.connectAndDownloadMs ?? 0)
        .floatField('totalMs', data.totalMs ?? 0)
        .timestamp(new Date());
    if (data.headers) {
        Object.entries(data.headers).forEach(([key, value]) => {
            const headerPoint = new influxdb_client_1.Point('service_webhook_header')
                .tag('serviceId', serviceId)
                .tag('header', key)
                .stringField('value', String(value))
                .timestamp(new Date());
            exports.writeApi.writePoint(headerPoint);
        });
    }
    exports.writeApi.writePoint(point);
    exports.writeApi.flush();
}
