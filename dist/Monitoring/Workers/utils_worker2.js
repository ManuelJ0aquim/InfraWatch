"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectIssues = detectIssues;
const CheckSNMP_1 = require("../Checkers/CheckSNMP");
const CheckHTTP_1 = require("../Checkers/CheckHTTP");
const CheckPING_1 = require("../Checkers/CheckPING");
const CheckWEBHOOK_1 = require("../Checkers/CheckWEBHOOK");
const socket_1 = require("../../socket");
const client_1 = require("@prisma/client");
const influxdb_1 = require("../../influxdb");
const prisma = new client_1.PrismaClient();
async function getServiceResult(service) {
    switch (service.type) {
        case client_1.ServiceType.HTTP:
            return (0, CheckHTTP_1.CheckHTTP)(service.target);
        case client_1.ServiceType.PING:
            return (0, CheckPING_1.CheckPING)(service.target);
        case client_1.ServiceType.SNMP:
            return (0, CheckSNMP_1.CheckSNMP)(service.target);
        case client_1.ServiceType.WEBHOOK:
            return (0, CheckWEBHOOK_1.CheckWebhook)(service.target);
        default:
            return null;
    }
}
async function processServiceResult(service, result) {
    const problems = [];
    if (!result) {
        problems.push({
            serviceName: service.name,
            description: 'Sem resposta ou resultado inválido',
        });
        return problems;
    }
    if (service.type === client_1.ServiceType.SNMP) {
        const io = (0, socket_1.getIO)();
        io.emit("snmpService", result);
        (0, influxdb_1.writeSnmpMetrics)(service.id.toString(), result);
        if (!result.sysName) {
            problems.push({
                serviceName: service.name,
                description: 'SNMP não retornou nome do sistema',
            });
        }
        await prisma.service.update({
            where: { id: service.id },
            data: {
                status: client_1.Status.UP,
                sysName: result.sysName || null,
                sysDescr: result.sysDescr || null,
            },
        });
    }
    else if (service.type === client_1.ServiceType.PING) {
        const io = (0, socket_1.getIO)();
        io.emit("pingService", result);
        (0, influxdb_1.writePingMetrics)(service.id.toString(), result);
        if (result.status !== client_1.Status.UP) {
            problems.push({
                serviceName: service.name,
                description: `Status: ${result.status}, Tempo de Processamento: ${result.minMs / result.avgMs / result.maxMs / result.mdevMs},
            perda de pacotes: ${result.lossPercent}%, Pacotes Transmitidos: ${result.transmitted},
            Pacotes Recebidos: ${result.received}, Quantidade de dados(bytes) ${result.data.length}`,
            });
        }
        await prisma.service.update({
            where: { id: service.id },
            data: {
                status: result.status,
                lastResponseMs: result.avgMs,
            },
        });
    }
    else if (service.type === client_1.ServiceType.HTTP) {
        const io = (0, socket_1.getIO)();
        io.emit("httpService", result);
        (0, influxdb_1.writeHttpMetrics)(service.id.toString(), result);
        if (result.status !== client_1.Status.UP) {
            problems.push({
                serviceName: service.name,
                description: `Status: ${result.status}, HTTP: ${result.httpStatus}, tempo total: ${result.totalMs}ms`,
            });
        }
    }
    else if (service.type === client_1.ServiceType.WEBHOOK) {
        const io = (0, socket_1.getIO)();
        io.emit("webhookService", result);
        (0, influxdb_1.writeWebhookMetrics)(service.id.toString(), result);
        if (result.status !== client_1.Status.UP) {
            problems.push({
                serviceName: service.name,
                description: `Status: ${result.status}, HTTP: ${result.httpStatus}, tempo total: ${result.totalMs}ms`,
            });
        }
        await prisma.service.update({
            where: { id: service.id },
            data: {
                status: result.status,
                lastResponseMs: result.totalMs,
            },
        });
    }
    else {
        (0, influxdb_1.writeMetric)(service.id.toString(), result.status, result.responseMs);
        if (result.status !== client_1.Status.UP) {
            problems.push({
                serviceName: service.name,
                description: `Status: ${result.status}, tempo resposta: ${result.responseMs}ms`,
            });
        }
        await prisma.service.update({
            where: { id: service.id },
            data: {
                status: result.status,
                lastResponseMs: result.responseMs,
            },
        });
    }
    return problems;
}
async function detectIssues() {
    const problems = [];
    const services = await prisma.service.findMany();
    for (const service of services) {
        try {
            const result = await getServiceResult(service);
            const serviceProblems = await processServiceResult(service, result);
            problems.push(...serviceProblems);
        }
        catch (error) {
            await prisma.service.update({
                where: { id: service.id },
                data: { status: client_1.Status.DOWN },
            });
            problems.push({
                serviceName: service.name,
                description: `Erro ao monitorar: ${error.message}`,
            });
        }
    }
    return problems;
}
