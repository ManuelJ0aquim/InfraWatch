import { Problem } from "../types/Problem";

export interface SnmpResult {
  sysName?: string;
  uptime?: number;
  sysDescr?: string;
  cpuLoad5min?: string;
  memFree?: string;
  memTotal?: string;
  error?: string;
  interfaces?: Array<{
    index: string;
    name: string;
    adminStatus: string;
    operStatus: string;
    ip?: string;
    mac?: string;
    speed?: string;
    inOctets?: string;
    outOctets?: string;
  }>;
}

export function analyzeSnmpIssue(
  service: { id: string; name: string },
  result: SnmpResult | null
): Problem | null {
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
      recommendation:
        "Verifique conectividade de rede, versão SNMP e credenciais de acesso.",
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
      recommendation:
        "Verifique a configuração SNMP no dispositivo e permissões da comunidade/usuário.",
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
      recommendation:
        "Verifique OIDs consultados e compatibilidade com o dispositivo.",
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
    const downInterfaces = result.interfaces.filter((iface) => {
      if (iface.operStatus !== "down") return false;
      if (!iface.ip) return false;

      const ignorePrefixes = ["Vlan", "Loopback", "Test", "Dummy"];
      return !ignorePrefixes.some((prefix) => iface.name.startsWith(prefix));
    });

    if (downInterfaces.length > 0) {
      const downInterfaceNames = downInterfaces.map((i) => i.name).join(", ");
      return {
        serviceId: service.id,
        serviceName: service.name,
        metric: "SNMP",
        value: 0,
        status: "DOWN",
        severity: "CRITICAL",
        priority: 1,
        description: `Interfaces de rede estão DOWN: ${downInterfaceNames}.`,
        recommendation: "Verifique o cabeamento e a configuração da interface.",
        timestamp,
      };
    }
  }

  return null;
}
