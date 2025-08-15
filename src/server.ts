import Fastify from 'fastify';
import fastifySwagger from 'fastify-swagger';
import { RegisterAllRoutes } from "./AllRoutes/RegisterAllRoutes";
import { startMonitoring } from './Monitoring/Workers/worker';
import { initSocket } from './socket';

const server = Fastify({
  logger: false,
});

// Configuração do Swagger
server.register(fastifySwagger, {
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

const start = async () => {
  try
  {
    RegisterAllRoutes(server);
    
    startMonitoring();
    
    await server.listen(3002, '0.0.0.0');
    console.log('Servidor Fastify rodando em http://localhost:3002');
    
    initSocket(server.server);
    
    console.log(`Documentação disponível em http://localhost:3002/docs`);
  }
  catch (err)
  {
    server.log.error(err);
    process.exit(1);
  }
};

start();