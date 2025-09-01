import snmp from "net-snmp";
import { Service } from "@prisma/client";
import { SNMP_OIDS } from "../../config/snmpConfig";

function createSession(ip: string, community: string, port: number){
  return snmp.createSession(ip, community,
  {
    port,
    timeout: 30000,
    version: snmp.Version2c,
  });
}

function safeSnmpValue(value: any, type: number): string {
  if (type === 4 && Buffer.isBuffer(value)) {
    if (value.length === 6)
    {
      return value.toString('hex').match(/.{1,2}/g)?.join(':').toUpperCase() || value.toString('hex');
    }
    
    const str = value.toString('utf8');
    
    const controlChars = (str.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/g) || []).length;
    const readableRatio = (str.length - controlChars) / str.length;
    
    if (readableRatio > 0.9 && str.length > 0)
    {
      return str.trim();
    }
    return value.toString('hex');
  }
  
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  if (typeof value === "number" || type === 2 || type === 64 || type === 65 || type === 66 || type === 67)
  {
    return value.toString();
  }
  if (value === null || value === undefined)
    return "N/A";
  return value.toString();
}

export async function CheckSNMP(service: Service)
{
  if (!service.snmpCommunity)
  {
    throw new Error(`[SNMP] Serviço ${service.name} não possui community SNMP configurada`);
  }

  const session = createSession(service.target, service.snmpCommunity, service.snmpPort ?? 161);

  try
  {    
    const generalOids = [
      SNMP_OIDS.sysName,
      SNMP_OIDS.sysDescr,
      SNMP_OIDS.sysUpTime,
      SNMP_OIDS.cpuLoad5min,
      SNMP_OIDS.memAvail,
      SNMP_OIDS.memTotal,
    ].filter(oid => oid);

    const generalMetrics: Record<string, string> = await new Promise((resolve, reject) => {
      session.get(generalOids, (err: any, varbinds: any) => {
        if (err)
        {
          return reject(err);
        }
        
        const result: Record<string, string> = {};
        varbinds.forEach((vb: any) => {
          if (!snmp.isVarbindError(vb))
          {
            result[vb.oid] = safeSnmpValue(vb.value, vb.type);
          }
          else
          {
            result[vb.oid] = "N/A";
          }
        });
        resolve(result);
      });
    });

    const interfaces = await getInterfaces(session, service);
    
    try
    {
      await getInterfaceIPs(session, interfaces);
    }
    catch (ipError: any)
    {
      console.log(`[SNMP] Não foi possível obter IPs das interfaces: ${ipError.message}`);
    }

    session.close();

    return {
      timestamp: new Date().toISOString(),
      ip: service.target,
      sysName: generalMetrics[SNMP_OIDS.sysName] || "N/A",
      metrics: {
        sysDescr: generalMetrics[SNMP_OIDS.sysDescr] || "N/A",
        sysUpTime: formatUptime(generalMetrics[SNMP_OIDS.sysUpTime]),
        cpuLoad5min: generalMetrics[SNMP_OIDS.cpuLoad5min] || "N/A",
        memFree: formatBytes(generalMetrics[SNMP_OIDS.memAvail]),
        memTotal: formatBytes(generalMetrics[SNMP_OIDS.memTotal]),
      },
      interfaces: interfaces.filter(i => i.name && i.name !== "N/A"),
    };
  }
  catch (error)
  {
    session.close();
    throw error;
  }
}

async function getInterfaces(session: any, service: Service): Promise<any[]>
{
  const interfaces = new Map<string, any>();
  
  const indexResults = await walkOID(session, SNMP_OIDS.ifIndex);
  
  if (indexResults.length === 0)
  {
    return [];
  }
  
  indexResults.forEach(vb => {
    const index = vb.value;
    interfaces.set(index, { 
      index,
      name: "N/A",
      type: "N/A",
      adminStatus: "N/A",
      operStatus: "N/A",
      mac: "N/A",
      speed: "N/A",
      inOctets: "0",
      outOctets: "0",
      inErrors: "0",
      outErrors: "0",
    });
  });

  const oidMappings = [
    { oid: SNMP_OIDS.ifDescr, prop: 'name' },
    { oid: SNMP_OIDS.ifType, prop: 'type', transform: (v: string) => getInterfaceType(parseInt(v)) },
    { oid: SNMP_OIDS.ifAdminStatus, prop: 'adminStatus', transform: (v: string) => v === '1' ? 'up' : 'down' },
    { oid: SNMP_OIDS.ifOperStatus, prop: 'operStatus', transform: (v: string) => v === '1' ? 'up' : 'down' },
    { oid: SNMP_OIDS.ifPhysAddress, prop: 'mac' },
    { oid: SNMP_OIDS.ifSpeed, prop: 'speed', transform: (v: string) => formatSpeed(v) },
    { oid: SNMP_OIDS.ifInOctets, prop: 'inOctets', transform: (v: string) => formatBytes(v) },
    { oid: SNMP_OIDS.ifOutOctets, prop: 'outOctets', transform: (v: string) => formatBytes(v) },
    // { oid: SNMP_OIDS.ifInErrors, prop: 'inErrors' },
    // { oid: SNMP_OIDS.ifOutErrors, prop: 'outErrors' },
  ].filter(m => m.oid);

  for (const mapping of oidMappings)
  {
    try
    {
      const results = await walkOID(session, mapping.oid);
      results.forEach(vb => {
        const index = extractIndexFromOID(vb.oid);
        const iface = interfaces.get(index);
        if (iface)
        {
          const value = vb.value;
          iface[mapping.prop] = mapping.transform ? mapping.transform(value) : value;
        }
      });
    }
    catch (error: any)
    {
      console.log(`[SNMP] Erro ao obter ${mapping.prop}: ${error.message}`);
    }
  }
  return Array.from(interfaces.values());
}

async function getInterfaceIPs(session: any, interfaces: any[]): Promise<void> 
{
  if (SNMP_OIDS.ipAddrTable)
  {
    const ipResults = await walkOID(session, SNMP_OIDS.ipAddrTable);
    ipResults.forEach(vb => {
      const parts = vb.oid.split('.');
      if (parts.length >= 5) {
        const ip = parts.slice(-4).join('.');
        const ifIndex = vb.value;
        const iface = interfaces.find(i => i.index === ifIndex);
        if (iface)
        {
          iface.ip = ip;
        }
      }
    });
  }
}

async function walkOID(session: any, oid: string): Promise<any[]>
{
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    let feedCalled = false;
    
    const timeout = setTimeout(() => {
      if (!feedCalled) {
        resolve(results);
      }
    }, 10000);
    
    session.subtree(
      oid,
      10,
      (varbinds: any) => {
        feedCalled = true;
        if (Array.isArray(varbinds))
        {
          varbinds.forEach((vb: any) => {
            if (!snmp.isVarbindError(vb)) {
              results.push({
                oid: vb.oid,
                value: safeSnmpValue(vb.value, vb.type),
                type: vb.type,
              });
            }
          });
        }
        else if (varbinds && !snmp.isVarbindError(varbinds))
        {
          results.push({
            oid: varbinds.oid,
            value: safeSnmpValue(varbinds.value, varbinds.type),
            type: varbinds.type,
          });
        }
      },
      (error: any) => {
        clearTimeout(timeout);
        if (error)
        {
          if (results.length > 0)
          {
            resolve(results);
          }
          else
          {
            reject(error);
          }
        }
        else
        {
          resolve(results);
        }
      }
    );
  });
}

export async function SnmpWalk(service: Service, oid: string): Promise<any[]>
{
  if (!service.snmpCommunity) 
  {
    throw new Error(`[SNMP] Serviço ${service.name} não possui community SNMP configurada`);
  }
  
  const session = createSession(service.target, service.snmpCommunity, service.snmpPort ?? 161);
  
  try
  {
    const results = await walkOID(session, oid);
    session.close();
    return results;
  }
  catch (error)
  {
    session.close();
    throw error;
  }
}

function extractIndexFromOID(oid: string): string
{
  const parts = oid.split('.');
  return parts[parts.length - 1];
}

function formatUptime(ticks: string | undefined): string
{
  if (!ticks || ticks === "N/A") return "N/A";
  
  const totalSeconds = Math.floor(parseInt(ticks) / 100);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function formatBytes(bytes: string | undefined): string
{
  if (!bytes || bytes === "N/A") return "N/A";
  
  const num = parseInt(bytes);
  if (isNaN(num)) return bytes;
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let value = num;
  
  while (value >= 1024 && unitIndex < units.length - 1)
  {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

function formatSpeed(speed: string | undefined): string
{
  if (!speed || speed === "N/A")
    return "N/A";
  
  const bps = parseInt(speed);
  if (isNaN(bps))
    return speed;
  
  if (bps >= 1000000000)
  {
    return `${(bps / 1000000000).toFixed(2)} Gbps`;
  }
  else if (bps >= 1000000)
  {
    return `${(bps / 1000000).toFixed(2)} Mbps`;
  }
  else if (bps >= 1000)
  {
    return `${(bps / 1000).toFixed(2)} Kbps`;
  }
  return `${bps} bps`;
}

function getInterfaceType(type: number): string
{
  const types: Record<number, string> = {
    1: 'other',
    6: 'ethernet',
    24: 'softwareLoopback',
    53: 'virtualInterface',
    131: 'tunnel',
    135: 'l2vlan',
  };
  return types[type] || `type-${type}`;
}