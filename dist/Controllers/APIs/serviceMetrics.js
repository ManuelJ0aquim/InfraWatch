"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryMetrics = queryMetrics;
exports.getPingMetrics = getPingMetrics;
exports.getSnmpMetrics = getSnmpMetrics;
exports.getHttpMetrics = getHttpMetrics;
exports.getWebhookMetrics = getWebhookMetrics;
const influxdb_1 = require("../../Influxdb/influxdb");
async function queryMetrics(serviceId, measurement) {
    const query = `
    from(bucket: "${process.env.INFLUX_BUCKET}")
      |> range(start: -1m)
      |> filter(fn: (r) => r._measurement == "${measurement}" and r.serviceId == "${serviceId}")
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"])
  `;
    try {
        const rows = await influxdb_1.queryApi.collectRows(query);
        return rows;
    }
    catch (error) {
        throw new Error(`Erro na consulta InfluxDB: ${error.message}`);
    }
}
async function getPingMetrics(serviceId) {
    try {
        const rows = await queryMetrics(serviceId, 'ping_metrics');
        const formattedRows = rows.map((row) => {
            const transmitted = row.packets_transmitted || 0;
            const received = row.packets_received;
            const loss = row.percent_packet_loss || 0;
            const min = row.minimum_response_ms || 0;
            const max = row.maximum_response_msMs || 0;
            const avg = row.average_response_ms || 0;
            const mdev = row.standard_deviation_ms || 0;
            const status = row.status || (received > 0 ? 'UP' : 'DOWN');
            return {
                time: row._time,
                serviceId: serviceId,
                packets_transmitted: transmitted,
                packets_received: received,
                percent_packet_loss: loss,
                minimum_response_ms: min,
                average_response_ms: avg,
                standard_deviation_ms: mdev,
                ttl: null,
                status
            };
        });
        return formattedRows;
    }
    catch (error) {
        throw error;
    }
}
async function getSnmpMetrics(serviceId) {
    try {
        const rows = await queryMetrics(serviceId, 'snmp_metrics');
        const formattedRows = rows.map((row) => ({
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
    catch (error) {
        throw error;
    }
}
async function getHttpMetrics(serviceId) {
    try {
        const rows = await queryMetrics(serviceId, 'http_metrics');
        const formattedRows = rows.map((row) => ({
            time: row._time,
            status: row.status || 'unknown',
            httpStatus: row.httpStatus || 0,
            ip: row.ip || '',
            sizeBytes: row.sizeBytes || 0,
            dnsMs: row.dnsMs || 0,
            connectAndDownloadMs: row.connectAndDownloadMs || 0,
            totalMs: row.totalMs || 0,
            headers: row.headers
                ? (typeof row.headers === 'string' ? JSON.parse(row.headers) : row.headers)
                : {},
        }));
        return formattedRows;
    }
    catch (error) {
        throw new Error(`Erro ao buscar métricas HTTP: ${error.message}`);
    }
}
async function getWebhookMetrics(serviceId) {
    try {
        const rows = await queryMetrics(serviceId, 'webhook_metrics');
        const formattedRows = rows.map((row) => ({
            time: row._time,
            status: row.status || 'unknown',
            httpStatus: row.httpStatus || 0,
            ip: row.ip || null,
            sizeBytes: row.sizeBytes || 0,
            dnsMs: row.dnsMs || 0,
            connectAndDownloadMs: row.connectAndDownloadMs || 0,
            totalMs: row.totalMs || 0,
            headers: row.headers || {},
            payloadSent: row.payloadSent || null,
            responseBody: row.responseBody || null,
        }));
        return formattedRows;
    }
    catch (error) {
        throw error;
    }
}
