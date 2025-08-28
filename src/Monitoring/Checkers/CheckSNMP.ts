import snmp from "net-snmp";
import { Service } from "@prisma/client";
import { SNMP_OIDS } from "../../config/snmpConfig";

function createSession(ip: string, community: string, port: number) {
  console.log(`[SNMP] Criando sessão para ${ip}:${port} (community=${community})`);
  return snmp.createSession(ip, community, {
    port,
    timeout: 30000,
    version: snmp.Version2c,
  });
}

function safeSnmpValue(value: any, type: number): string {
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  if (typeof value === "number" || type === 2 || type === 64) return value.toString();
  if (value === null || value === undefined) return "N/A";
  return value.toString();
}

export async function CheckSNMP(service: Service) {
  if (!service.snmpCommunity) {
    throw new Error(`[SNMP] Serviço ${service.name} não possui community SNMP configurada`);
  }

  const session = createSession(service.target, service.snmpCommunity, service.snmpPort ?? 161);

  console.log(`[SNMP] Recuperando métricas gerais para ${service.name} (${service.target})`);
  const generalMetrics: Record<string, string> = await new Promise((resolve, reject) => {
    session.get(
      Object.values(SNMP_OIDS).filter(
        oid => ![
          SNMP_OIDS.ifIndex,
          SNMP_OIDS.ifDescr,
          SNMP_OIDS.ifType,
          SNMP_OIDS.ifAdminStatus,
          SNMP_OIDS.ifOperStatus,
          SNMP_OIDS.ifAlias,
          SNMP_OIDS.ifPhysAddress,
          SNMP_OIDS.ifInOctets,
          SNMP_OIDS.ifOutOctets,
          SNMP_OIDS.ipAddrTable
        ].includes(oid)
      ),
      (err: any, varbinds: any) => {
        if (err) {
          console.log(`[SNMP] Erro ao obter métricas gerais: ${err.message}`);
          return reject(err);
        }
        const result: Record<string, string> = {};
        varbinds.forEach(vb => {
          result[vb.oid] = !snmp.isVarbindError(vb) ? safeSnmpValue(vb.value, vb.type) : "N/A";
          console.log(`[SNMP] Geral: OID=${vb.oid}, valor=${result[vb.oid]}`);
        });
        resolve(result);
      }
    );
  });

  const interfaceOIDs = [
    SNMP_OIDS.ifIndex,
    SNMP_OIDS.ifDescr,
    SNMP_OIDS.ifType,
    SNMP_OIDS.ifAdminStatus,
    SNMP_OIDS.ifOperStatus,
    SNMP_OIDS.ifAlias,
    SNMP_OIDS.ifPhysAddress,
    SNMP_OIDS.ifInOctets,
    SNMP_OIDS.ifOutOctets,
  ];

  const interfaces: any[] = [];
  for (const oid of interfaceOIDs) {
    console.log(`[SNMP] Varredura da tabela de interfaces para OID ${oid}`);
    const rows = await SnmpWalk(service, oid);
    rows.forEach(vb => {
      const parts = vb.oid.split(".");
      const index = parts[parts.length - 1];
      let iface = interfaces.find(i => i.index === index);
      if (!iface) {
        iface = { index };
        interfaces.push(iface);
      }
      switch (oid) {
        case SNMP_OIDS.ifDescr: iface.name = vb.value; break;
        case SNMP_OIDS.ifType: iface.type = vb.value; break;
        case SNMP_OIDS.ifAdminStatus: iface.adminStatus = vb.value; break;
        case SNMP_OIDS.ifOperStatus: iface.status = vb.value; break;
        case SNMP_OIDS.ifAlias: iface.alias = vb.value; break;
        case SNMP_OIDS.ifPhysAddress: iface.mac = vb.value; break;
        case SNMP_OIDS.ifInOctets: iface.inOctets = vb.value; break;
        case SNMP_OIDS.ifOutOctets: iface.outOctets = vb.value; break;
      }
      console.log(`[SNMP] Interface index=${index}, OID=${oid}, valor=${vb.value}`);
    });
  }

  console.log(`[SNMP] Varredura da tabela IP`);
  const ipRows = await SnmpWalk(service, SNMP_OIDS.ipAddrTable);
  ipRows.forEach(vb => {
    const parts = vb.oid.split(".");
    const index = parts[parts.length - 1];
    const iface = interfaces.find(i => i.index === index);
    if (iface) {
      iface.ip = vb.value;
      console.log(`[SNMP] Interface index=${index} IP=${vb.value}`);
    }
  });

  session.close();
  console.log(`[SNMP] Sessão finalizada para ${service.target}`);

  return {
    timestamp: new Date().toISOString(),
    ip: service.target,
    sysName: generalMetrics[SNMP_OIDS.sysName],
    metrics: {
      sysDescr: generalMetrics[SNMP_OIDS.sysDescr],
      sysUpTime: generalMetrics[SNMP_OIDS.sysUpTime],
      cpu5Sec: generalMetrics[SNMP_OIDS.cpuLoad1min],
      memFree: generalMetrics[SNMP_OIDS.memAvail],
      memUsed: generalMetrics[SNMP_OIDS.memTotal],
      ifOperStatus: generalMetrics[SNMP_OIDS.ifOperStatus],
    },
    interfaces
  };
}

export async function SnmpWalk(service: Service, oid: string) {
  console.log(`[SNMP] Iniciando SnmpWalk para OID ${oid} no host ${service.target}`);
  const session = createSession(service.target, service.snmpCommunity!, service.snmpPort ?? 161);
  const results: any[] = [];

  return new Promise<any[]>((resolve, reject) => {
    session.subtree(
      oid,
      (varbind: any) => {
        results.push({
          oid: varbind.oid,
          value: safeSnmpValue(varbind.value, varbind.type),
          type: varbind.type,
        });
      },
      (error: any) => {
        session.close();
        if (error) {
          console.log(`[SNMP] Erro no SnmpWalk para OID ${oid}: ${error.message}`);
          reject(error);
        } else {
          console.log(`[SNMP] Concluído SnmpWalk para OID ${oid}, ${results.length} resultados`);
          resolve(results);
        }
      }
    );
  });
}
