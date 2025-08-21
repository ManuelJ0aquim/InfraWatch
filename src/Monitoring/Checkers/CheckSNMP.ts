import snmp from 'net-snmp';

interface SNMPData {
  uptime?: string;
  sysName?: string;
  sysDescr?: string;
  cpuLoad1min?: number;
  memTotalKB?: number;
  memAvailKB?: number;
  memUsagePercent?: number;
  interfaces?:
  {
    index: string;
    description: string;
    status: string;
    inOctets?: number;
    outOctets?: number;
  }[];
  responseMs: number;
}

export async function CheckSNMP(target: string, community = 'public', timeoutMs = 5000): Promise<SNMPData>
{
  const session = snmp.createSession(target, community, { timeout: timeoutMs });

  const OIDS = {
    // uptime: '1.3.6.1.2.1.1.3.0',
    sysName: '1.3.6.1.2.1.1.5.0',
    sysDescr: '1.3.6.1.2.1.1.1.0',
    sysUpTime: '1.3.6.1.2.1.1.3.0'
    // cpuLoad1min: '1.3.6.1.4.1.2021.10.1.3.1',
    // memTotalKB: '1.3.6.1.4.1.2021.4.5.0',
    // memAvailKB: '1.3.6.1.4.1.2021.4.6.0'

  };

  const start = Date.now();

  const getOids = (oids: string[]) =>
  {
    return new Promise<any[]>((resolve, reject) => {
      session.get(oids, (err: any, varbinds: any) => {
        if (err) return reject(err);
        resolve(varbinds);
      });
    });
  };

  const walk = (oid: string) => {
    return new Promise<any[]>((resolve, reject) => {
      const results: any[] = [];
      session.subtree(oid, (vb: any) => {
        if (!snmp.isVarbindError(vb)) results.push(vb);
      }, (err:any) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  };

  try
  {
    const baseData: any = { responseMs: 0 };

    const varbinds = await getOids(Object.values(OIDS));
    varbinds.forEach(vb =>
    {
      const key = Object.keys(OIDS).find(k => OIDS[k as keyof typeof OIDS] === vb.oid) as keyof SNMPData;
      if (key && vb.value !== null) baseData[key] = vb.value;
    });

    if (baseData.cpuLoad1min)
      baseData.cpuLoad1min = parseFloat(String(baseData.cpuLoad1min));
    if (baseData.memTotalKB && baseData.memAvailKB)
    {
      baseData.memUsagePercent = Number(((1 - (baseData.memAvailKB / baseData.memTotalKB)) * 100).toFixed(2));
    }

    const [ifDescr, ifStatus, ifInOctets, ifOutOctets] = await Promise.all([
      walk('1.3.6.1.2.1.2.2.1.2'),  // Nome
      walk('1.3.6.1.2.1.2.2.1.8'),  // Status
      walk('1.3.6.1.2.1.2.2.1.10'), // Bytes recebidos
      walk('1.3.6.1.2.1.2.2.1.16')  // Bytes enviados
    ]);

    const interfaces = ifDescr.map(vb =>
    {
      const index = vb.oid.split('.').pop()!;
      const statusVb = ifStatus.find(s => s.oid.endsWith(`.${index}`));
      const inVb = ifInOctets.find(s => s.oid.endsWith(`.${index}`));
      const outVb = ifOutOctets.find(s => s.oid.endsWith(`.${index}`));

      return {
        index,
        description: vb.value.toString(),
        status: ['unknown', 'up', 'down', 'testing'][statusVb?.value as number] || 'unknown',
        inOctets: inVb?.value ?? 0,
        outOctets: outVb?.value ?? 0
      };
    });

    baseData.interfaces = interfaces;
    baseData.responseMs = Date.now() - start;

    return baseData;
  }
  finally
  {
    session.close();
  }
}
