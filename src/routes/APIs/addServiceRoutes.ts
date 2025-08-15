import { FastifyInstance } from 'fastify';
import { addService } from '../../Controllers/APIs/addServices';

export async function addServiceRoutes(fastify: FastifyInstance)
{
  fastify.post('/api/addServices', {
    schema: {
      description: 'Adicionar novo serviço',
      tags: ['Services'],
      body: {
        type: 'object',
        required: ['name', 'type', 'target', 'ownerId'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['HTTP', 'PING', 'SNMP', 'WEBHOOK'] },
          target: { type: 'string' },
          ownerId: { type: 'string' },
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            target: { type: 'string' },
            ownerId: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          }
        }
      }
    }
  }, addService);
}
