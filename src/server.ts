import Fastify from 'fastify';
import { initSocket } from './socket';
import fastifySwagger from 'fastify-swagger';
import { startMonitoring } from './Monitoring/Workers/worker';
import { RegisterAllRoutes } from "./RegisterRoutes/RegisterRoutes";
import cron from 'node-cron';
import { syncGlpiInventory } from './Integrations/GLPI/glpiClient'

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
    server.get('/sync-glpi', async (request, reply) => {
      await syncGlpiInventory();
      return { message: 'Sincronização com GLPI concluída.' };
    });
    // Sincroniza a cada hora
    cron.schedule('0 * * * *', async () => {
      console.log('Sincronizando inventário com GLPI...');
      await syncGlpiInventory();
    });

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