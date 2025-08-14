import Fastify from 'fastify';
import fastifySwagger from 'fastify-swagger';
import { PrismaClient } from '@prisma/client';
import { RegisterAllRoutes } from "./AllRoutes/RegisterAllRoutes";
import { startMonitoring } from './Monitoring/Workers/worker';
import { initializeSLAManager } from './Sla/sla.manager';

const server = Fastify({
    logger: false,
});

const prisma = new PrismaClient(); 

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
    console.log('🔧 Inicializando gerenciador de SLAs...');
    await initializeSLAManager(prisma, {
      autoUpdateEnabled: true,
      autoUpdateIntervalMinutes: 60,
      createMissingSLAs: true,
      updatePendingSLAs: true,
      cleanupOldSLAsEnabled: true,
      cleanupOlderThanDays: 365
    });

    await RegisterAllRoutes(server);
    startMonitoring();
    await server.listen({ port: 3000 });
    console.log('✅ Servidor rodando em http://localhost:3000');
    console.log('📊 Dashboard SLA disponível em: http://localhost:3000/docs');
  }
  catch (err)
  {
    console.error('❌ Erro ao iniciar servidor:', err);
    server.log.error(err);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('🛑 Recebido SIGTERM, finalizando servidor...');
  try {
    await server.close();
    await prisma.$disconnect();
    console.log('✅ Servidor finalizado graciosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao finalizar servidor:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('🛑 Recebido SIGINT, finalizando servidor...');
  try {
    await server.close();
    await prisma.$disconnect();
    console.log('✅ Servidor finalizado graciosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao finalizar servidor:', error);
    process.exit(1);
  }
});

start();
