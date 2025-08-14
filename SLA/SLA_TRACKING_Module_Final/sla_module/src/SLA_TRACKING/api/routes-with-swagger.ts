import { FastifyInstance } from "fastify";
import { getSlaStatus } from "./controllers/slaStatus.controller";
import { listIncidents, createIncidentHandler } from "./controllers/incidents.controller";
import { listMaintenances, createMaintenanceHandler } from "./controllers/maintenance.controller";
import { listPoliciesHandler, createPolicyHandler } from "./controllers/policies.controller";
import { listViolationsHandler } from "./controllers/violations.controller";

export default async function slaRoutes(app: FastifyInstance) {
  // SLA Status
  app.get("/api/services/:id/sla/status", {
    schema: {
      description: 'Consultar status de SLA de um serviço',
      tags: ['SLA Status'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'ID do serviço' }
        },
        required: ['id']
      },
      querystring: {
        type: 'object',
        properties: {
          period: { type: 'string', description: 'Período no formato YYYY-MM (ex: 2025-08)' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            serviceId: { type: 'string' },
            period: { type: 'string' },
            uptimePercent: { type: 'number' },
            targetPercent: { type: 'number' },
            status: { type: 'string', enum: ['OK', 'AT_RISK', 'BREACHED'] },
            budgetMinutes: { type: 'number' },
            usedMinutes: { type: 'number' }
          }
        }
      }
    }
  }, getSlaStatus);

  // Incidents
  app.get("/api/services/:id/sla/incidents", {
    schema: {
      description: 'Listar incidentes de um serviço',
      tags: ['Incidents'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'ID do serviço' }
        },
        required: ['id']
      },
      querystring: {
        type: 'object',
        properties: {
          from: { type: 'string', format: 'date-time', description: 'Data de início do período' },
          to: { type: 'string', format: 'date-time', description: 'Data de fim do período' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  serviceId: { type: 'string' },
                  startedAt: { type: 'string', format: 'date-time' },
                  endedAt: { type: 'string', format: 'date-time' },
                  isPlanned: { type: 'boolean' }
                }
              }
            }
          }
        }
      }
    }
  }, listIncidents);

  app.post("/api/services/:id/sla/incidents", {
    schema: {
      description: 'Criar um novo incidente',
      tags: ['Incidents'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'ID do serviço' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        required: ['startedAt'],
        properties: {
          startedAt: { type: 'string', format: 'date-time', description: 'Data/hora de início do incidente' },
          endedAt: { type: 'string', format: 'date-time', description: 'Data/hora de fim do incidente (opcional)' },
          isPlanned: { type: 'boolean', default: false, description: 'Se o incidente foi planejado' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            serviceId: { type: 'string' },
            startedAt: { type: 'string', format: 'date-time' },
            endedAt: { type: 'string', format: 'date-time' },
            isPlanned: { type: 'boolean' }
          }
        }
      }
    }
  }, createIncidentHandler);

  // Maintenance Windows
  app.get("/api/services/:id/maintenance-windows", {
    schema: {
      description: 'Listar janelas de manutenção de um serviço',
      tags: ['Maintenance'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'ID do serviço' }
        },
        required: ['id']
      },
      querystring: {
        type: 'object',
        properties: {
          from: { type: 'string', format: 'date-time', description: 'Data de início do período' },
          to: { type: 'string', format: 'date-time', description: 'Data de fim do período' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  serviceId: { type: 'string' },
                  startsAt: { type: 'string', format: 'date-time' },
                  endsAt: { type: 'string', format: 'date-time' },
                  reason: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, listMaintenances);

  app.post("/api/services/:id/maintenance-windows", {
    schema: {
      description: 'Agendar uma nova janela de manutenção',
      tags: ['Maintenance'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'ID do serviço' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        required: ['startsAt', 'endsAt'],
        properties: {
          startsAt: { type: 'string', format: 'date-time', description: 'Data/hora de início da manutenção' },
          endsAt: { type: 'string', format: 'date-time', description: 'Data/hora de fim da manutenção' },
          reason: { type: 'string', description: 'Motivo da manutenção' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            serviceId: { type: 'string' },
            startsAt: { type: 'string', format: 'date-time' },
            endsAt: { type: 'string', format: 'date-time' },
            reason: { type: 'string' }
          }
        }
      }
    }
  }, createMaintenanceHandler);

  // SLA Policies
  app.get("/api/sla/policies", {
    schema: {
      description: 'Listar todas as políticas de SLA',
      tags: ['Policies'],
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  serviceId: { type: 'string' },
                  systemId: { type: 'string' },
                  targetPct: { type: 'number' },
                  period: { type: 'string' },
                  timezone: { type: 'string' },
                  activeFrom: { type: 'string', format: 'date-time' },
                  activeTo: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    }
  }, listPoliciesHandler);

  app.post("/api/sla/policies", {
    schema: {
      description: 'Criar uma nova política de SLA',
      tags: ['Policies'],
      body: {
        type: 'object',
        required: ['targetPct', 'period', 'timezone'],
        properties: {
          serviceId: { type: 'string', format: 'uuid', description: 'ID do serviço (obrigatório se systemId não fornecido)' },
          systemId: { type: 'string', format: 'uuid', description: 'ID do sistema (obrigatório se serviceId não fornecido)' },
          targetPct: { type: 'number', minimum: 0, maximum: 100, description: 'Percentual de uptime desejado (ex: 99.9)' },
          period: { type: 'string', enum: ['MONTH'], description: 'Período de avaliação' },
          timezone: { type: 'string', description: 'Timezone para cálculos (ex: Africa/Luanda)' },
          activeFrom: { type: 'string', format: 'date-time', description: 'Data de início da política' },
          activeTo: { type: 'string', format: 'date-time', description: 'Data de fim da política (opcional)' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            serviceId: { type: 'string' },
            systemId: { type: 'string' },
            targetPct: { type: 'number' },
            period: { type: 'string' },
            timezone: { type: 'string' },
            activeFrom: { type: 'string', format: 'date-time' },
            activeTo: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, createPolicyHandler);

  // SLA Violations
  app.get("/api/sla/policies/:policyId/violations", {
    schema: {
      description: 'Listar violações de uma política de SLA',
      tags: ['Violations'],
      params: {
        type: 'object',
        properties: {
          policyId: { type: 'string', format: 'uuid', description: 'ID da política' }
        },
        required: ['policyId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  policyId: { type: 'string' },
                  windowId: { type: 'string' },
                  violatedAt: { type: 'string', format: 'date-time' },
                  uptimePct: { type: 'number' },
                  targetPct: { type: 'number' },
                  severity: { type: 'string', enum: ['AT_RISK', 'BREACHED'] }
                }
              }
            }
          }
        }
      }
    }
  }, listViolationsHandler);
}
