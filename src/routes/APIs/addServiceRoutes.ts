import { FastifyInstance } from 'fastify';
import { addService } from '../../Controllers/APIs/addServices';
import { syncServiceToGLPI } from '../../Integrations/GLPI/syncServices';

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
          criticality: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
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
            criticality: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
          400: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          500: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        }
      }
    }
  }, addService);
}
