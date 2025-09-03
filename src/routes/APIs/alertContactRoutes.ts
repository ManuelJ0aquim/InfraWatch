import { FastifyInstance } from 'fastify';
import { AlertContactController } from '../../Controllers/APIs/alertContact';
import { notificationController } from '../../Notifications/Notification';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function alertContactRoutes(fastify: FastifyInstance) {
  const controller = new AlertContactController();

  // 🔥 CORRIGIDO: Incluir campo "level" na criação
  fastify.post('/api/alert-contact', {
    schema: {
      description: 'Criar um novo contato de alerta para um serviço',
      tags: ['AlertContact'],
      body: {
        type: 'object',
        required: ['serviceId', 'channel', 'to'],
        properties: {
          serviceId: { type: 'string' },
          channel: { type: 'string', enum: ['email', 'slack', 'telegram', 'twilio'] },
          to: { type: 'string' },
          level: { type: 'integer', minimum: 1, maximum: 5, default: 1 }, // 🔥 NOVO
          active: { type: 'boolean', default: true },
        },
      },
    },
  }, async (request, reply) => {
    try {
      return await controller.create(request, reply);
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Erro ao criar contato' });
    }
  });

  // 🔥 MELHORADO: Response schema mais detalhado
  fastify.get('/api/alert-contact/:serviceId', {
    schema: {
      description: 'Listar todos os contatos de alerta de um serviço',
      tags: ['AlertContact'],
      params: {
        type: 'object',
        properties: { serviceId: { type: 'string' } },
        required: ['serviceId'],
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              serviceId: { type: 'string' },
              channel: { type: 'string' },
              to: { type: 'string' },
              level: { type: 'integer' },
              active: { type: 'boolean' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            }
          }
        }
      }
    },
  }, async (request, reply) => {
    try {
      return await controller.list(request, reply);
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Erro ao buscar contatos' });
    }
  });

  // 🔥 CORRIGIDO: Incluir campo "level" na atualização
  fastify.put('/api/alert-contact/:id', {
    schema: {
      description: 'Atualizar um contato de alerta',
      tags: ['AlertContact'],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          channel: { type: 'string', enum: ['email', 'slack', 'telegram', 'twilio'] },
          to: { type: 'string' },
          level: { type: 'integer', minimum: 1, maximum: 5 }, // 🔥 NOVO
          active: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      return await controller.update(request, reply);
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Erro ao atualizar contato' });
    }
  });

  fastify.delete('/api/alert-contact/:id', {
    schema: {
      description: 'Deletar um contato de alerta',
      tags: ['AlertContact'],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    },
  }, async (request, reply) => {
    try {
      return await controller.delete(request, reply);
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Erro ao remover contato' });
    }
  });

  // 🔥 NOVO: Rota para testar notificações
  fastify.post('/api/alert-contact/:id/test', {
    schema: {
      description: 'Testar envio de notificação para um contato',
      tags: ['AlertContact'],
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          message: { type: 'string', default: 'Teste de notificação do InfraWatch' }
        }
      }
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { message } = request.body as { message?: string };
      
      const contact = await prisma.alertContact.findUnique({ where: { id } });
      if (!contact) {
        return reply.status(404).send({ error: 'Contato não encontrado' });
      }

      const testMessage = message || `🧪 Teste de notificação do InfraWatch\n\nEste é um teste do sistema de alertas.\nContato: ${contact.to}\nCanal: ${contact.channel}\nNível: ${contact.level}`;
      
      const result = await notificationController.send(
        contact.channel as any, 
        contact.to, 
        testMessage,
        { retry: 1, timeout: 10000 }
      );

      return {
        success: result.success,
        channel: result.channel,
        to: result.to,
        messageId: result.messageId,
        error: result.error?.message,
        timestamp: result.timestamp
      };
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Erro ao testar notificação' });
    }
  });

  // 🔥 NOVO: Listar contatos por nível de escalonamento
  fastify.get('/api/alert-contact/:serviceId/level/:level', {
    schema: {
      description: 'Listar contatos de um serviço por nível específico',
      tags: ['AlertContact'],
      params: {
        type: 'object',
        properties: { 
          serviceId: { type: 'string' },
          level: { type: 'integer', minimum: 1, maximum: 5 }
        },
        required: ['serviceId', 'level'],
      },
    },
  }, async (request, reply) => {
    try {
      const { serviceId, level } = request.params as { serviceId: string; level: number };
      
      const contacts = await prisma.alertContact.findMany({
        where: { 
          serviceId, 
          level: parseInt(level.toString()),
          active: true 
        },
        orderBy: { level: 'asc' }
      });

      return contacts;
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: 'Erro ao buscar contatos por nível' });
    }
  });
}