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
        return rows.map((row) => {
            const transmitted = row.packets_transmitted || 0;
            const received = row.packets_received || 0;
            const loss = row.percent_packet_loss || 0;
            const min = row.minimum_response_ms || 0;
            const max = row.maximum_response_ms || 0;
            const avg = row.average_response_ms || 0;
            const mdev = row.standard_deviation_ms || 0;
            const status = row.status || (received > 0 ? 'UP' : 'DOWN');
            return {
                time: row._time,
                serviceId,
                packets_transmitted: transmitted,
                packets_received: received,
                percent_packet_loss: loss,
                minimum_response_ms: min,
                maximum_response_ms: max,
                average_response_ms: avg,
                standard_deviation_ms: mdev,
                ttl: row.ttl || null,
                status,
            };
        });
    }
    catch (error) {
        throw error;
    }
}
async function getSnmpMetrics(serviceId) {
    try {
        const systemRows = await queryMetrics(serviceId, "snmp_system");
        const system = systemRows.map((row) => ({
            time: row._time,
            sysName: row.sysName || "unknown",
            sysDescr: row.sysDescr || "N/A",
            sysUpTime: row.sysUpTime || "N/A",
            cpuLoad5sec: row.cpuLoad5sec || 0,
            cpuLoad5min: row.cpuLoad5min || 0,
            memFreeBytes: row.memFreeBytes || 0,
            memTotalBytes: row.memTotalBytes || 0,
            memUsedPercent: row.memUsedPercent || 0,
        }));
        const ifaceRows = await queryMetrics(serviceId, "snmp_interface");
        const interfaces = ifaceRows.map((row) => ({
            time: row._time,
            ifIndex: row.ifIndex,
            ifName: row.ifName,
            ifType: row.ifType,
            adminStatus: row.adminStatus,
            operStatus: row.operStatus,
            mac: row.mac,
            speedBps: row.speedBps || 0,
            inBytes: row.inBytes || 0,
            outBytes: row.outBytes || 0,
            inErrors: row.inErrors || 0,
            outErrors: row.outErrors || 0,
            ip: row.ipAddress || null,
        }));
        const summaryRows = await queryMetrics(serviceId, "snmp_summary");
        const summary = summaryRows.map((row) => ({
            time: row._time,
            totalInterfaces: row.totalInterfaces || 0,
            interfacesUp: row.interfacesUp || 0,
            interfacesDown: row.interfacesDown || 0,
            totalInBytes: row.totalInBytes || 0,
            totalOutBytes: row.totalOutBytes || 0,
            totalErrors: row.totalErrors || 0,
        }));
        const sensorRows = await queryMetrics(serviceId, "snmp_sensor");
        const sensors = {
            temperature: [],
            fanStatus: [],
            psuStatus: [],
            powerDraw: [],
        };
        for (const row of sensorRows) {
            switch (row.type) {
                case "temperature":
                    sensors.temperature.push({
                        time: row._time,
                        index: row.index,
                        value: row.value,
                    });
                    break;
                case "fan":
                    sensors.fanStatus.push({
                        time: row._time,
                        index: row.index,
                        status: row.status,
                    });
                    break;
                case "psu":
                    sensors.psuStatus.push({
                        time: row._time,
                        index: row.index,
                        status: row.status,
                    });
                    break;
                case "power":
                    sensors.powerDraw.push({
                        time: row._time,
                        index: row.index,
                        watts: row.watts,
                    });
                    break;
            }
        }
        return { system, interfaces, summary, sensors };
    }
    catch (error) {
        throw error;
    }
}
async function getHttpMetrics(serviceId) {
    try {
        const rows = await queryMetrics(serviceId, 'http_metrics');
        return rows.map((row) => ({
            time: row._time,
            status: row.status || 'unknown',
            httpStatus: row.httpStatus || 0,
            ip: row.ip || '',
            sizeBytes: row.sizeBytes || 0,
            dnsMs: row.dnsMs || 0,
            connectAndDownloadMs: row.connectAndDownloadMs || 0,
            totalMs: row.totalMs || 0,
            headers: row.headers
                ? (typeof row.headers === 'string'
                    ? JSON.parse(row.headers)
                    : row.headers)
                : {},
        }));
    }
    catch (error) {
        throw new Error(`Erro ao buscar métricas HTTP: ${error.message}`);
    }
}
async function getWebhookMetrics(serviceId) {
    try {
        const rows = await queryMetrics(serviceId, 'webhook_metrics');
        return rows.map((row) => ({
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
    }
    catch (error) {
        throw error;
    }
}
