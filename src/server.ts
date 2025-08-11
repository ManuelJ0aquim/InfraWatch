import Fastify, { fastify } from 'fastify';
import fastifySwagger from 'fastify-swagger';
import { RegisterAllRoutes } from "./AllRoutes/RegisterAllRoutes";
import { startMonitoring } from './Monitor/worker';

const server = Fastify({
    logger: false,
}); 

server.register(fastifySwagger, {
    routePrefix: '/docs',
    swagger: {
      info: {
        title: 'InfraWatch API',
        description: 'API do sistema InfraWatch',
        version: '0.1.0',
      },
      host: 'localhost:3000',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
    exposeRoute: true,
  });

const start = async () =>
{
  try
  {
    await RegisterAllRoutes(server);
    startMonitoring();
    await server.listen({ port: 3000 });
    console.log('Servidor rodando em http://localhost:3000');
  }
  catch (err)
  {
    server.log.error(err);
    process.exit(1);
  }
};

start();
