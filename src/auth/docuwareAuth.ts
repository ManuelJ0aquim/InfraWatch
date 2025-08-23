import { FastifyRequest, FastifyReply } from 'fastify';

export async function authenticate(req: FastifyRequest, res: FastifyReply) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).send({ error: 'Unauthorized' });
  }
  // Opcional: validar token JWT/OAuth2 aqui
}