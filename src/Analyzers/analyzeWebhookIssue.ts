import { Problem } from "../types/Problem";

export interface WebhookResult {
  status: string;
  httpStatus?: number;
  totalMs?: number;
}

export function analyzeWebhookIssue(
  service: { id: string; name: string },
  result: WebhookResult | null
): Problem | null {
  const timestamp = new Date().toISOString();

  if (!result) {
    return {
      serviceId: service.id,
      serviceName: service.name,
      metric: "WEBHOOK",
      value: 0,
      status: "DOWN",
      severity: "CRITICAL",
      priority: 1,
      description: "Sem resposta do endpoint Webhook.",
      recommendation:
        "Verifique se o servidor do webhook está ativo e acessível.",
      timestamp,
    };
  }

  if (result.status !== "UP") {
    if (result.httpStatus && result.httpStatus >= 500) {
      return {
        serviceId: service.id,
        serviceName: service.name,
        metric: "WEBHOOK",
        value: result.httpStatus,
        status: "DOWN",
        severity: "CRITICAL",
        priority: 1,
        description: `Falha no webhook. HTTP ${result.httpStatus}`,
        recommendation:
          "Verifique logs do servidor que recebe o webhook.",
        timestamp,
      };
    }

    if (result.httpStatus && result.httpStatus >= 400) {
      return {
        serviceId: service.id,
        serviceName: service.name,
        metric: "WEBHOOK",
        value: result.httpStatus,
        status: "DOWN",
        severity: "HIGH",
        priority: 2,
        description: `Falha no webhook. Erro de cliente HTTP ${result.httpStatus}`,
        recommendation:
          "Verifique configuração do endpoint, autenticação ou payload enviado.",
        timestamp,
      };
    }

    return {
      serviceId: service.id,
      serviceName: service.name,
      metric: "WEBHOOK",
      value: result.httpStatus ?? 0,
      status: "DOWN",
      severity: "WARNING",
      priority: 3,
      description: "Falha no webhook: resposta inesperada ou inválida.",
      recommendation:
        "Confirme que o endpoint do webhook responde corretamente ao formato esperado.",
      timestamp,
    };
  }

  if (result.totalMs && result.totalMs > 3000) {
    return {
      serviceId: service.id,
      serviceName: service.name,
      metric: "WEBHOOK",
      value: result.totalMs,
      status: "UP",
      severity: "WARNING",
      priority: 3,
      description: `Webhook respondeu em ${result.totalMs}ms (acima do normal).`,
      recommendation:
        "Monitorar latência do endpoint e possíveis gargalos de rede.",
      timestamp,
    };
  }

  return null;
}
