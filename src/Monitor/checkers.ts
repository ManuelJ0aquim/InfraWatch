import axios from 'axios';
import ping from 'ping';
import snmp from 'net-snmp';

// Check HTTP simples
export async function checkHTTP(target: string) {
  const start = Date.now();
  try {
    await axios.get(target, { timeout: 5000 });
    return { status: 'UP', responseMs: Date.now() - start };
  } catch {
    return { status: 'DOWN', responseMs: Date.now() - start };
  }
}

// Check PING simples
export async function checkPING(target: string) {
  const start = Date.now();
  const res = await ping.promise.probe(target, { timeout: 5 });
  return {
    status: res.alive ? 'UP' : 'DOWN',
    responseMs: Date.now() - start,
  };
}

// Check SNMP avançado, pega infos do sistema + interfaces de rede
export async function checkSNMPFull(target: string, community = 'public') {
  const session = snmp.createSession(target, community);

  // OIDs principais para sistema e recursos
  const baseOids = [
    '1.3.6.1.2.1.1.3.0',          // sysUpTime
    '1.3.6.1.2.1.1.5.0',          // sysName
    '1.3.6.1.2.1.1.1.0',          // sysDescr
    '1.3.6.1.4.1.2021.10.1.3.1', // CPU Load 1min (UCD-SNMP-MIB)
    '1.3.6.1.4.1.2021.4.5.0',     // MemTotalReal (KB)
    '1.3.6.1.4.1.2021.4.6.0',     // MemAvailReal (KB)
  ];

  return new Promise((resolve, reject) => {
    const start = Date.now();

    session.get(baseOids, (error: any, varbinds: any) => {
      if (error) {
        session.close();
        return reject(error);
      }

      const data: any = {};
      for (const vb of varbinds) {
        if (snmp.isVarbindError(vb)) continue;

        switch (vb.oid) {
          case '1.3.6.1.2.1.1.3.0': data.uptime = vb.value.toString(); break;
          case '1.3.6.1.2.1.1.5.0': data.sysName = vb.value.toString(); break;
          case '1.3.6.1.2.1.1.1.0': data.sysDescr = vb.value.toString(); break;
          case '1.3.6.1.4.1.2021.10.1.3.1': data.cpuLoad1min = vb.value.toString(); break;
          case '1.3.6.1.4.1.2021.4.5.0': data.memTotalKB = vb.value; break;
          case '1.3.6.1.4.1.2021.4.6.0': data.memAvailKB = vb.value; break;
        }
      }

      // Pega tabela de interfaces de rede: descrição e status
      const interfaces: any[] = [];
      // A OID 1.3.6.1.2.1.2.2.1.2 = ifDescr (nome)
      // A OID 1.3.6.1.2.1.2.2.1.8 = ifOperStatus (status: 1=up, 2=down, etc)
      let errors = false;

      session.subtree('1.3.6.1.2.1.2.2.1.2', (varbind: any) => {
        if (snmp.isVarbindError(varbind)) return;

        const ifaceIndex = varbind.oid.split('.').pop()!;
        interfaces.push({ index: ifaceIndex, description: varbind.value.toString() });
      }, (error: any) => {
        if (error) errors = true;
      });

      // Pega status das interfaces (ifOperStatus)
      session.subtree('1.3.6.1.2.1.2.2.1.8', (varbind: any) => {
        if (snmp.isVarbindError(varbind)) return;

        const ifaceIndex = varbind.oid.split('.').pop()!;
        const iface = interfaces.find(i => i.index === ifaceIndex);
        if (iface) {
          iface.status = ['unknown', 'up', 'down', 'testing'][vb.value as number] || 'unknown';
        }
      }, (error: any) => {
        session.close();
        if (error) return reject(error);

        if (errors) return reject(new Error('Erro ao buscar tabela SNMP'));

        data.interfaces = interfaces;
        data.responseMs = Date.now() - start;
        resolve(data);
      });
    });
  });
}

// Check webhook simples via POST
export async function checkWebhook(url: string): Promise<{ status: string; responseMs: number }> {
  const start = Date.now();
  try {
    const response = await axios.post(url, { ping: true });
    const responseMs = Date.now() - start;

    if (response.status >= 200 && response.status < 300) {
      return { status: 'UP', responseMs };
    } else {
      return { status: 'DOWN', responseMs };
    }
  } catch {
    const responseMs = Date.now() - start;
    return { status: 'DOWN', responseMs };
  }
}
