"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeSnmpMetrics = writeSnmpMetrics;
const influxdb_client_1 = require("@influxdata/influxdb-client");
const influxdb_1 = require("../influxdb");
async function writeSnmpMetrics(serviceId, data) {
    const points = [];
    const systemPoint = new influxdb_client_1.Point("snmp_system")
        .tag("serviceId", serviceId)
        .tag("ip", data.ip)
        .tag("sysName", data.sysName || "unknown")
        .stringField("sysDescr", data.metrics.sysDescr || "N/A")
        .stringField("sysUpTime", data.metrics.sysUpTime || "N/A");
    if (data.metrics.cpuLoad5min && data.metrics.cpuLoad5min !== "N/A") {
        const cpuValue = parseFloat(data.metrics.cpuLoad5min);
        if (!isNaN(cpuValue)) {
            systemPoint.floatField("cpuLoad5min", cpuValue);
        }
    }
    if (data.metrics.memFree && data.metrics.memFree !== "N/A") {
        systemPoint.stringField("memFree", data.metrics.memFree);
        const memFreeMatch = data.metrics.memFree.match(/^([\d.]+)\s*(\w+)/);
        if (memFreeMatch) {
            const value = parseFloat(memFreeMatch[1]);
            const unit = memFreeMatch[2];
            const bytesValue = convertToBytes(value, unit);
            if (bytesValue !== null) {
                systemPoint.intField("memFreeBytes", bytesValue);
            }
        }
    }
    if (data.metrics.memTotal && data.metrics.memTotal !== "N/A") {
        systemPoint.stringField("memTotal", data.metrics.memTotal);
        const memTotalMatch = data.metrics.memTotal.match(/^([\d.]+)\s*(\w+)/);
        if (memTotalMatch) {
            const value = parseFloat(memTotalMatch[1]);
            const unit = memTotalMatch[2];
            const bytesValue = convertToBytes(value, unit);
            if (bytesValue !== null) {
                systemPoint.intField("memTotalBytes", bytesValue);
                const memFreeBytes = systemPoint.fields["memFreeBytes"];
                if (memFreeBytes && typeof memFreeBytes === "number") {
                    const usedPercent = ((bytesValue - memFreeBytes) / bytesValue) * 100;
                    systemPoint.floatField("memUsedPercent", usedPercent);
                }
            }
        }
    }
    systemPoint.timestamp(new Date(data.timestamp));
    points.push(systemPoint);
    if (data.interfaces && Array.isArray(data.interfaces)) {
        for (const iface of data.interfaces) {
            const ifacePoint = new influxdb_client_1.Point("snmp_interface")
                .tag("serviceId", serviceId)
                .tag("ip", data.ip)
                .tag("sysName", data.sysName || "unknown")
                .tag("ifIndex", String(iface.index))
                .tag("ifName", iface.name || "unknown")
                .tag("ifType", iface.type || "unknown")
                .tag("adminStatus", iface.adminStatus || "unknown")
                .tag("operStatus", iface.operStatus || "unknown");
            if (iface.mac && iface.mac !== "N/A") {
                ifacePoint.stringField("mac", iface.mac);
            }
            if (iface.ip) {
                ifacePoint.stringField("ipAddress", iface.ip);
            }
            if (iface.speed && iface.speed !== "N/A") {
                ifacePoint.stringField("speed", iface.speed);
                const speedBps = parseSpeed(iface.speed);
                if (speedBps !== null) {
                    ifacePoint.intField("speedBps", speedBps);
                }
            }
            if (iface.inOctets && iface.inOctets !== "N/A") {
                ifacePoint.stringField("inOctets", iface.inOctets);
                const inBytes = parseBytes(iface.inOctets);
                if (inBytes !== null) {
                    ifacePoint.intField("inBytes", inBytes);
                }
            }
            if (iface.outOctets && iface.outOctets !== "N/A") {
                ifacePoint.stringField("outOctets", iface.outOctets);
                const outBytes = parseBytes(iface.outOctets);
                if (outBytes !== null) {
                    ifacePoint.intField("outBytes", outBytes);
                }
            }
            if (iface.inErrors && iface.inErrors !== "N/A") {
                const inErrors = parseInt(iface.inErrors);
                if (!isNaN(inErrors)) {
                    ifacePoint.intField("inErrors", inErrors);
                }
            }
            if (iface.outErrors && iface.outErrors !== "N/A") {
                const outErrors = parseInt(iface.outErrors);
                if (!isNaN(outErrors)) {
                    ifacePoint.intField("outErrors", outErrors);
                }
            }
            ifacePoint.timestamp(new Date(data.timestamp));
            points.push(ifacePoint);
        }
    }
    const summaryPoint = new influxdb_client_1.Point("snmp_summary")
        .tag("serviceId", serviceId)
        .tag("ip", data.ip)
        .tag("sysName", data.sysName || "unknown")
        .intField("totalInterfaces", data.interfaces?.length || 0)
        .intField("interfacesUp", data.interfaces?.filter((i) => i.operStatus === "up").length || 0)
        .intField("interfacesDown", data.interfaces?.filter((i) => i.operStatus === "down").length || 0)
        .timestamp(new Date(data.timestamp));
    if (data.interfaces && Array.isArray(data.interfaces)) {
        let totalInBytes = 0;
        let totalOutBytes = 0;
        let totalErrors = 0;
        for (const iface of data.interfaces) {
            if (iface.operStatus === "up") {
                const inBytes = parseBytes(iface.inOctets);
                const outBytes = parseBytes(iface.outOctets);
                if (inBytes !== null)
                    totalInBytes += inBytes;
                if (outBytes !== null)
                    totalOutBytes += outBytes;
                if (iface.inErrors && iface.inErrors !== "N/A") {
                    totalErrors += parseInt(iface.inErrors) || 0;
                }
                if (iface.outErrors && iface.outErrors !== "N/A") {
                    totalErrors += parseInt(iface.outErrors) || 0;
                }
            }
        }
        summaryPoint
            .intField("totalInBytes", totalInBytes)
            .intField("totalOutBytes", totalOutBytes)
            .intField("totalErrors", totalErrors);
    }
    points.push(summaryPoint);
    if (Array.isArray(data.metrics.temperature)) {
        data.metrics.temperature.forEach((temp, idx) => {
            const value = parseFloat(temp);
            if (!isNaN(value)) {
                points.push(new influxdb_client_1.Point("snmp_sensor")
                    .tag("serviceId", serviceId)
                    .tag("ip", data.ip)
                    .tag("sysName", data.sysName || "unknown")
                    .tag("type", "temperature")
                    .tag("index", String(idx))
                    .floatField("value", value)
                    .timestamp(new Date(data.timestamp)));
            }
        });
    }
    if (Array.isArray(data.metrics.fanStatus)) {
        data.metrics.fanStatus.forEach((status, idx) => {
            points.push(new influxdb_client_1.Point("snmp_sensor")
                .tag("serviceId", serviceId)
                .tag("ip", data.ip)
                .tag("sysName", data.sysName || "unknown")
                .tag("type", "fan")
                .tag("index", String(idx))
                .stringField("status", status)
                .timestamp(new Date(data.timestamp)));
        });
    }
    if (Array.isArray(data.metrics.psuStatus)) {
        data.metrics.psuStatus.forEach((status, idx) => {
            points.push(new influxdb_client_1.Point("snmp_sensor")
                .tag("serviceId", serviceId)
                .tag("ip", data.ip)
                .tag("sysName", data.sysName || "unknown")
                .tag("type", "psu")
                .tag("index", String(idx))
                .stringField("status", status)
                .timestamp(new Date(data.timestamp)));
        });
    }
    if (Array.isArray(data.metrics.powerDraw)) {
        data.metrics.powerDraw.forEach((pwr, idx) => {
            const match = pwr.match(/^([\d.]+)\s*W/i);
            const value = match ? parseFloat(match[1]) : null;
            if (value !== null && !isNaN(value)) {
                points.push(new influxdb_client_1.Point("snmp_sensor")
                    .tag("serviceId", serviceId)
                    .tag("ip", data.ip)
                    .tag("sysName", data.sysName || "unknown")
                    .tag("type", "power")
                    .tag("index", String(idx))
                    .floatField("watts", value)
                    .timestamp(new Date(data.timestamp)));
            }
        });
    }
    for (const point of points) {
        influxdb_1.writeApi.writePoint(point);
    }
    await influxdb_1.writeApi.flush();
}
function convertToBytes(value, unit) {
    const units = {
        B: 1,
        KB: 1024,
        MB: 1024 * 1024,
        GB: 1024 * 1024 * 1024,
        TB: 1024 * 1024 * 1024 * 1024,
    };
    const multiplier = units[unit.toUpperCase()];
    if (multiplier) {
        return Math.round(value * multiplier);
    }
    return null;
}
function parseBytes(bytesStr) {
    if (!bytesStr || bytesStr === "N/A")
        return null;
    const directParse = parseInt(bytesStr);
    if (!isNaN(directParse))
        return directParse;
    const match = bytesStr.match(/^([\d.]+)\s*(\w+)/);
    if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2];
        return convertToBytes(value, unit);
    }
    return null;
}
function parseSpeed(speedStr) {
    if (!speedStr || speedStr === "N/A")
        return null;
    const directParse = parseInt(speedStr);
    if (!isNaN(directParse))
        return directParse;
    const match = speedStr.match(/^([\d.]+)\s*(\w+)/);
    if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        const multipliers = {
            bps: 1,
            kbps: 1000,
            mbps: 1000000,
            gbps: 1000000000,
        };
        const multiplier = multipliers[unit];
        if (multiplier) {
            return Math.round(value * multiplier);
        }
    }
    return null;
}
