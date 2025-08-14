import fastify, { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import slaRoutes from './src/SLA_TRACKING/api/routes'; // Importa as rotas do módulo

// Cria uma instância do servidor Fastify
const app: FastifyInstance = fastify({
  logger: true, // Ativa o logger para ver os pedidos no terminal
});

// Função principal para configurar e iniciar o servidor
async function startServer() {
  try {
    // 1. Configurar o Swagger para gerar a documentação da API
    await app.register(swagger, {
      swagger: {
        info: {
          title: 'SLA Tracking API',
          description: 'API para monitoramento de SLA e uptime',
          version: '1.0.0'
        },
        host: 'localhost:3000', // Host e porta onde o servidor estará a correr
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
      },
    });

    // 2. Configurar a Interface de Utilizador (UI) do Swagger
    await app.register(swaggerUi, {
      routePrefix: '/docs', // O URL para aceder à UI será http://localhost:3000/docs
      uiConfig: {
        docExpansion: 'full',
        deepLinking: false,
      },
    });

    // 3. Registar as rotas do módulo de SLA Tracking
    await app.register(slaRoutes);

    // 4. Iniciar o servidor
    await app.listen({ port: 3000, host: '0.0.0.0' });

    // A mensagem abaixo será exibida quando o servidor arrancar com sucesso
    app.log.info(`Servidor a correr em http://localhost:3000`);
    app.log.info(`Swagger UI disponível em http://localhost:3000/docs`);

  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Executa a função para iniciar o servidor
startServer();