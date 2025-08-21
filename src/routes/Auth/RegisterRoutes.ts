import { FastifyInstance } from 'fastify';
import { Register } from '../../Controllers/Auth/Register';

export async function RegisterRoutes(fastify: FastifyInstance)
{
  fastify.post('/register', {
    schema: {
      description: 'Registrar novo usuário',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' }
          }
        }
      }
    }
  }, Register);
}
