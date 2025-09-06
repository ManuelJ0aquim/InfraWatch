import Fastify from 'fastify';
import localtunnel from 'localtunnel';
import { initSocket } from './socket';
import fastifySwagger from 'fastify-swagger';
import { startMonitoring } from './Monitoring/Workers/worker';
import { RegisterAllRoutes } from "./RegisterRoutes/RegisterRoutes";
import { syncGlpiInventory } from './Integrations/GLPI/glpiClient';
import cron from 'node-cron';

const PORT = Number(process.env.PORT) || 3000;
const SUBDOMAIN = process.env.LOCALTUNNEL_SUBDOMAIN;

const server = Fastify({ logger: false });

server.register(fastifySwagger, {
  routePrefix: '/docs',
  swagger: {
    info: { title: 'InfraWatch API', description: 'API do InfraWatch', version: '0.1.0' },
    host: `localhost:${PORT}`,
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

    // Manual GLPI sync endpoint
    server.get('/sync-glpi', async (request, reply) => {
      try {
        await syncGlpiInventory();
        return reply.code(200).send({ message: 'Sincronização com GLPI concluída.' });
      } catch (error) {
        console.error('Error during manual GLPI sync:', error.message);
        return reply.code(500).send({ message: 'Erro durante sincronização com GLPI', error: error.message });
      }
    });
    // Schedule hourly GLPI sync
    cron.schedule('*/5 * * * *', async () => {
      console.log('Sincronizando inventário com GLPI...');
      await syncGlpiInventory();
    });
    initSocket(server.server);
    await startMonitoring();

    await server.listen(PORT, '0.0.0.0');
    console.log(`Servidor Fastify rodando em http://localhost:${PORT}`);
    console.log(`Documentação disponível em http://localhost:${PORT}/docs`);

    const tunnel = await localtunnel({ port: PORT, subdomain: SUBDOMAIN });
    console.log(`Servidor exposto publicamente em ${tunnel.url}`);
    console.log(`Documentação disponível em ${tunnel.url}/docs`);

    tunnel.on('close', () => {
      console.log('Túnel Localtunnel fechado');
    });
  }
  catch (err)
  {
    server.log.error(err);
    process.exit(1);
  }
};

start();
