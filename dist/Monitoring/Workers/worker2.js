"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processProxyData = processProxyData;
const socket_1 = require("../../socket");
const PingIssueAnalyzer_1 = require("../../Analyzers/PingIssueAnalyzer");
const HttpIssueAnalyzer_1 = require("../../Analyzers/HttpIssueAnalyzer");
const analyzeSnmpIssue_1 = require("../../Analyzers/analyzeSnmpIssue");
const WriteSnmpMetrics_1 = require("../../Influxdb/WriteMetrics/WriteSnmpMetrics");
const WritePingMetrics_1 = require("../../Influxdb/WriteMetrics/WritePingMetrics");
const WriteHttpMetrics_1 = require("../../Influxdb/WriteMetrics/WriteHttpMetrics");
async function processProxyData(data) {
    const io = (0, socket_1.getIO)();
    const problems = [];
    console.log(data);
    if (!data || !data.type) {
        problems.push({
            serviceId: data?.id || "unknown",
            serviceName: data?.target || "unknown",
            metric: "unknown",
            value: 0,
            status: "UNKNOWN",
            description: "Dados inválidos recebidos do proxy",
            recommendation: "Verifique se o proxy está enviando os dados corretamente",
            priority: 2,
            severity: "WARNING",
            timestamp: new Date().toISOString(),
        });
        return problems;
    }
    switch (data.type) {
        case "SNMP":
            io.emit("snmpService", data);
            await (0, WriteSnmpMetrics_1.writeSnmpMetrics)(data.serviceId, data);
            const snmpAnalysis = await (0, analyzeSnmpIssue_1.analyzeSnmpIssue)({ id: data.serviceId, name: data.target }, data);
            if (snmpAnalysis) {
                problems.push(snmpAnalysis);
            }
            break;
        case "PING":
            io.emit("pingService", data);
            await (0, WritePingMetrics_1.writePingMetrics)(data.serviceId, data);
            const pingAnalysis = (0, PingIssueAnalyzer_1.analyzePingIssue)({ id: data.serviceId, name: data.target }, data);
            if (pingAnalysis)
                problems.push(pingAnalysis);
            break;
        case "HTTP":
            io.emit("httpService", data);
            await (0, WriteHttpMetrics_1.writeHttpMetrics)(data.serviceId, data);
            const httpAnalysis = (0, HttpIssueAnalyzer_1.analyzeHttpIssue)({ id: data.serviceId, name: data.target }, data);
            if (httpAnalysis)
                problems.push(httpAnalysis);
            break;
        default:
            problems.push({
                serviceId: data.serviceId,
                serviceName: data.target,
                metric: "unknown",
                value: 0,
                status: "UNKNOWN",
                description: `Tipo de serviço desconhecido: ${data.type}`,
                recommendation: "Verifique a configuração do proxy",
                priority: 2,
                severity: "WARNING",
                timestamp: new Date().toISOString(),
            });
    }
    return problems;
}
