import Fastify from 'fastify';
import fastifySwagger from 'fastify-swagger';
import { RegisterAllRoutes } from "./AllRoutes/RegisterAllRoutes";
import { startMonitoring } from './Monitoring/Workers/worker';
import http from 'http';
import { initSocket } from './socket';

async function start() {
  const fastify = Fastify({ logger: false });

  fastify.register(fastifySwagger, {
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

  await RegisterAllRoutes(fastify);

  const httpServer = http.createServer(fastify.server);

  // Inicializa Socket.IO e guarda a instância
  initSocket(httpServer);

  startMonitoring();

  httpServer.listen(3000, '0.0.0.0', () => {
    console.log('Servidor rodando em http://localhost:3000');
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
