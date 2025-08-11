import fp from 'fastify-plugin';

export default fp(async (fastify) => {
  fastify.register(import('fastify-jwt'), {
    secret: process.env.JWT_SECRET || 'supersecret', // ideal usar variável de ambiente
  });

  fastify.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ message: 'Unauthorized' });
    }
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
  } 
}
