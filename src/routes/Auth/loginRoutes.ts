import { FastifyInstance } from 'fastify';
import { Login } from '../../Controllers/Auth/login';

export async function LoginRoutes(fastify: FastifyInstance)
{
  fastify.post('/login', {
    schema: {
      description: 'Login do usuário',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' }
          }
        }
      }
    }
  }, Login);
}
