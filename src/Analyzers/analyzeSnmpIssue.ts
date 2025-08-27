import { Problem } from "../types/Problem";

export interface SnmpResult {
  sysName?: string;
  uptime?: number;
  error?: string;
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

  return null; // Sem problemas detectados
}
