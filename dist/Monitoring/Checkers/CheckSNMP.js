"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckSNMP = CheckSNMP;
const net_snmp_1 = __importDefault(require("net-snmp"));
async function CheckSNMP(target, community = 'public', timeoutMs = 5000) {
    const session = net_snmp_1.default.createSession(target, community, { timeout: timeoutMs });
    const OIDS = {
        uptime: '1.3.6.1.2.1.1.3.0',
        sysName: '1.3.6.1.2.1.1.5.0',
        sysDescr: '1.3.6.1.2.1.1.1.0',
        cpuLoad1min: '1.3.6.1.4.1.2021.10.1.3.1',
        memTotalKB: '1.3.6.1.4.1.2021.4.5.0',
        memAvailKB: '1.3.6.1.4.1.2021.4.6.0'
    };
    const start = Date.now();
    // Helper para GET
    const getOids = (oids) => {
        return new Promise((resolve, reject) => {
            session.get(oids, (err, varbinds) => {
                if (err)
                    return reject(err);
                resolve(varbinds);
            });
        });
    };
    // Helper para SUBTREE
    const walk = (oid) => {
        return new Promise((resolve, reject) => {
            const results = [];
            session.subtree(oid, (vb) => {
                if (!net_snmp_1.default.isVarbindError(vb))
                    results.push(vb);
            }, (err) => {
                if (err)
                    return reject(err);
                resolve(results);
            });
        });
    };
    try {
        const baseData = { responseMs: 0 };
        // Dados principais
        const varbinds = await getOids(Object.values(OIDS));
        varbinds.forEach(vb => {
            const key = Object.keys(OIDS).find(k => OIDS[k] === vb.oid);
            if (key && vb.value !== null)
                baseData[key] = vb.value;
        });
        // Conversões
        if (baseData.cpuLoad1min)
            baseData.cpuLoad1min = parseFloat(String(baseData.cpuLoad1min));
        if (baseData.memTotalKB && baseData.memAvailKB) {
            baseData.memUsagePercent = Number(((1 - (baseData.memAvailKB / baseData.memTotalKB)) * 100).toFixed(2));
        }
        // Interfaces
        const [ifDescr, ifStatus, ifInOctets, ifOutOctets] = await Promise.all([
            walk('1.3.6.1.2.1.2.2.1.2'), // Nome
            walk('1.3.6.1.2.1.2.2.1.8'), // Status
            walk('1.3.6.1.2.1.2.2.1.10'), // Bytes recebidos
            walk('1.3.6.1.2.1.2.2.1.16') // Bytes enviados
        ]);
        const interfaces = ifDescr.map(vb => {
            const index = vb.oid.split('.').pop();
            const statusVb = ifStatus.find(s => s.oid.endsWith(`.${index}`));
            const inVb = ifInOctets.find(s => s.oid.endsWith(`.${index}`));
            const outVb = ifOutOctets.find(s => s.oid.endsWith(`.${index}`));
            return {
                index,
                description: vb.value.toString(),
                status: ['unknown', 'up', 'down', 'testing'][statusVb?.value] || 'unknown',
                inOctets: inVb?.value ?? 0,
                outOctets: outVb?.value ?? 0
            };
        });
        baseData.interfaces = interfaces;
        baseData.responseMs = Date.now() - start;
        return baseData;
    }
    finally {
        session.close();
    }
}
