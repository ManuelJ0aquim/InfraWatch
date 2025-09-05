"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeSnmpIssue = analyzeSnmpIssue;
const redis_1 = require("./redis");
async function analyzeSnmpIssue(service, result) {
    const timestamp = new Date().toISOString();
    if (!result) {
        return {
            serviceId: service.id,
            serviceName: service.name,
            metric: "SNMP",
            value: 0,
            status: "DOWN",
            severity: "CRITICAL",
            priority: 1,
            description: "Sem resposta SNMP — dispositivo inacessível.",
            recommendation: "Verifique conectividade de rede, versão SNMP e credenciais de acesso.",
            timestamp,
        };
    }
    if (result.error) {
        return {
            serviceId: service.id,
            serviceName: service.name,
            metric: "SNMP",
            value: 0,
            status: "DOWN",
            severity: "HIGH",
            priority: 2,
            description: `Erro SNMP: ${result.error}`,
            recommendation: "Verifique a configuração SNMP no dispositivo e permissões da comunidade/usuário.",
            timestamp,
        };
    }
    if (!result.sysName) {
        return {
            serviceId: service.id,
            serviceName: service.name,
            metric: "SNMP",
            value: 0,
            status: "DOWN",
            severity: "CRITICAL",
            priority: 1,
            description: "SNMP respondeu mas não retornou informações básicas.",
            recommendation: "Verifique OIDs consultados e compatibilidade com o dispositivo.",
            timestamp,
        };
    }
    if (result.uptime && result.uptime < 300) {
        return {
            serviceId: service.id,
            serviceName: service.name,
            metric: "SNMP",
            value: result.uptime,
            status: "UP",
            severity: "WARNING",
            priority: 3,
            description: `Dispositivo SNMP foi reiniciado recentemente (uptime: ${result.uptime}s).`,
            recommendation: "Verifique logs do dispositivo para entender causa do reboot.",
            timestamp,
        };
    }
    if (result.cpuLoad5min && parseFloat(result.cpuLoad5min) > 80) {
        return {
            serviceId: service.id,
            serviceName: service.name,
            metric: "SNMP",
            value: parseFloat(result.cpuLoad5min),
            status: "UP",
            severity: "HIGH",
            priority: 2,
            description: `Uso de CPU elevado: ${result.cpuLoad5min}% nos últimos 5 minutos.`,
            recommendation: "Verifique processos e carga no dispositivo.",
            timestamp,
        };
    }
    if (result.memFree && parseFloat(result.memFree) < 50) {
        return {
            serviceId: service.id,
            serviceName: service.name,
            metric: "SNMP",
            value: parseFloat(result.memFree),
            status: "UP",
            severity: "HIGH",
            priority: 2,
            description: `Memória livre baixa: ${result.memFree} MB.`,
            recommendation: "Considere aumentar a memória ou reduzir a carga no dispositivo.",
            timestamp,
        };
    }
    if (result.interfaces) {
        for (const iface of result.interfaces) {
            if (!iface.ip)
                continue;
            if (["Vlan", "Loopback", "Test", "Dummy"].some((p) => iface.name.startsWith(p))) {
                continue;
            }
            const key = `interfaceStatus:${service.id}:${iface.name}`;
            const prevStatus = await redis_1.redis.get(key);
            const currentStatus = iface.operStatus;
            if (prevStatus !== currentStatus) {
                await redis_1.redis.set(key, currentStatus, "EX", 60 * 60 * 24);
                if (currentStatus === "down") {
                    return {
                        serviceId: service.id,
                        serviceName: service.name,
                        metric: "SNMP",
                        value: 0,
                        status: "DOWN",
                        severity: "CRITICAL",
                        priority: 1,
                        description: `Interface ${iface.name} caiu (estava UP antes).`,
                        recommendation: "Verifique cabeamento ou configuração.",
                        timestamp,
                    };
                }
                else if (currentStatus === "up" && prevStatus === "down") {
                    return {
                        serviceId: service.id,
                        serviceName: service.name,
                        metric: "SNMP",
                        value: 1,
                        status: "UP",
                        severity: "INFO",
                        priority: 4,
                        description: `Interface ${iface.name} voltou para UP.`,
                        recommendation: "Normalizado.",
                        timestamp,
                    };
                }
            }
        }
    }
    return null;
}
