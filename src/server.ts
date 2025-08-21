import Fastify from 'fastify';
import { initSocket } from './socket';
import fastifySwagger from 'fastify-swagger';
import { startMonitoring } from './Monitoring/Workers/worker';
import { RegisterAllRoutes } from "./RegisterRoutes/RegisterRoutes";

const server = Fastify(
{
  logger: false,
});

server.register(fastifySwagger,
{
  routePrefix: '/docs',
  swagger: {
    info: {
      title: 'InfraWatch API',
      description: 'API do sistema InfraWatch',
      version: '0.1.0',
    },
    host: 'localhost:3002',
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
    RegisterAllRoutes(server);

    initSocket(server.server);
    await startMonitoring();

    await server.listen(3002, '0.0.0.0');
    console.log('Servidor Fastify rodando em http://localhost:3002');
    console.log(`Documentação disponível em http://localhost:3002/docs`);
  }
  catch (err)
  {
    server.log.error(err);
    process.exit(1);
  }
};

start();