import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🔥 MELHORADO: Schema mais completo
const incidentSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    serviceId: { type: 'string' },
    openedAt: { type: 'string', format: 'date-time' },
    closedAt: { type: 'string', format: 'date-time', nullable: true },
    reason: { type: 'string', nullable: true },
    retryCount: { type: 'integer' },
    lastNotificationAt: { type: 'string', format: 'date-time', nullable: true },
    escalationLevel: { type: 'integer' },
    glpiTicketId: { type: 'string', nullable: true },
    glpiTicketUrl: { type: 'string', nullable: true },
    service: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        type: { type: 'string' },
        criticality: { type: 'string' },
      },
    },
  },
};

export async function incidentRoutes(app: FastifyInstance) {
  
  // 🔥 MELHORADO: Mais informações nos incidentes abertos
  app.get('/open', {
    schema: {
      tags: ['Incidents'],
      summary: 'Listar incidentes abertos',
      querystring: {
        type: 'object',
        properties: {
          escalationLevel: { type: 'integer', minimum: 1, maximum: 5 }
        }
      },
      response: {
        200: { type: 'array', items: incidentSchema },
      },
    },
    handler: async (req) => {
      const { escalationLevel } = req.query as { escalationLevel?: number };
      
      return prisma.incident.findMany({
        where: { 
          closedAt: null,
          ...(escalationLevel ? { escalationLevel } : {})
        },
        orderBy: { openedAt: 'desc' },
        include: { 
          service: {
            select: {
              id: true,
              name: true,
              type: true,
              criticality: true
            }
          }
        },
      });
    },
  });

  // 🔥 NOVO: Estatísticas de incidentes
  app.get('/stats', {
    schema: {
      tags: ['Incidents'],
      summary: 'Estatísticas de incidentes',
      querystring: {
        type: 'object',
        properties: {
          period: { type: 'string', default: '7d' } // 1h, 24h, 7d, 30d
        }
      }
    },
    handler: async (req) => {
      const { period } = req.query as { period?: string };
      
      // Calcular data de início baseado no período
      const periodMap: Record<string, number> = {
        '1h': 1000 * 60 * 60,
        '24h': 1000 * 60 * 60 * 24,
        '7d': 1000 * 60 * 60 * 24 * 7,
        '30d': 1000 * 60 * 60 * 24 * 30
      };
      
      const periodMs = periodMap[period || '7d'] || periodMap['7d'];
      const since = new Date(Date.now() - periodMs);

      const [totalIncidents, openIncidents, byEscalationLevel, avgResolutionTime] = await Promise.all([
        // Total de incidentes no período
        prisma.incident.count({
          where: { openedAt: { gte: since } }
        }),
        
        // Incidentes ainda abertos
        prisma.incident.count({
          where: { closedAt: null }
        }),
        
        // Incidentes por nível de escalonamento
        prisma.incident.groupBy({
          by: ['escalationLevel'],
          where: { openedAt: { gte: since } },
          _count: { escalationLevel: true }
        }),
        
        // Tempo médio de resolução (apenas incidentes fechados)
        prisma.incident.findMany({
          where: { 
            openedAt: { gte: since },
            closedAt: { not: null }
          },
          select: {
            openedAt: true,
            closedAt: true
          }
        })
      ]);

      // Calcular tempo médio de resolução
      const avgResolution = avgResolutionTime.length > 0 
        ? avgResolutionTime.reduce((acc: any, inc: any) => {
            const duration = inc.closedAt!.getTime() - inc.openedAt.getTime();
            return acc + duration;
          }, 0) / avgResolutionTime.length
        : null;

      return {
        period,
        totalIncidents,
        openIncidents,
        resolvedIncidents: totalIncidents - openIncidents,
        byEscalationLevel,
        avgResolutionTimeMs: avgResolution,
        avgResolutionTimeFormatted: avgResolution 
          ? `${Math.round(avgResolution / 60000)} minutos`
          : null
      };
    },
  });

  app.get('/history', {
    schema: {
      tags: ['Incidents'],
      summary: 'Histórico de incidentes',
      querystring: {
        type: 'object',
        properties: {
          serviceId: { type: 'string' },
          limit: { type: 'integer', default: 50, maximum: 1000 },
          offset: { type: 'integer', default: 0 }
        },
      },
      response: {
        200: { type: 'array', items: incidentSchema },
      },
    },
    handler: async (req) => {
      const { serviceId, limit = 50, offset = 0 } = req.query as { 
        serviceId?: string; 
        limit?: number;
        offset?: number;
      };
      
      return prisma.incident.findMany({
        where: { serviceId: serviceId || undefined },
        orderBy: { openedAt: 'desc' },
        take: limit,
        skip: offset,
        include: { 
          service: {
            select: {
              id: true,
              name: true,
              type: true,
              criticality: true
            }
          }
        },
      });
    },
  });

  app.post('/:id/close', {
    schema: {
      tags: ['Incidents'],
      summary: 'Fechar incidente manualmente',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          reason: { type: 'string', default: 'manual-close' }
        }
      },
      response: {
        200: incidentSchema,
      },
    },
    handler: async (req) => {
      const { id } = req.params as { id: string };
      const { reason } = req.body as { reason?: string };
      
      return prisma.incident.update({
        where: { id },
        data: { 
          closedAt: new Date(), 
          reason: reason || 'manual-close' 
        },
        include: { service: true },
      });
    },
  });
}