import Fastify from 'fastify';
import fastifySwagger from 'fastify-swagger';
import { RegisterAllRoutes } from "./AllRoutes/RegisterAllRoutes";
import { startMonitoring } from './Monitoring/Workers/worker';
import http from 'http';
import { initSocket } from './socket';

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

const start = async () => {
  try {
    await RegisterAllRoutes(server);
    const httpServer = http.createServer(server.server);

    // Inicializa Socket.IO e guarda a instância
    initSocket(httpServer);
    startMonitoring();
    await server.listen({ port: 3002 });
    console.log('Servidor rodando em http://localhost:3002');
  }
  catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();