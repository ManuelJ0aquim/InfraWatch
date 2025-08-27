import ngrok from 'ngrok';
import Fastify from 'fastify';
import { initSocket } from './socket';
import fastifySwagger from 'fastify-swagger';
import { startMonitoring } from './Monitoring/Workers/worker';
import { RegisterAllRoutes } from "./RegisterRoutes/RegisterRoutes";

const PORT = process.env.PORT || '';

const server = Fastify({ logger: false });

server.register(fastifySwagger, {
  routePrefix: '/docs',
  swagger: {
    info: {
      title: 'InfraWatch API',
      description: 'API do sistema InfraWatch',
      version: '0.1.0',
    },
    host: `localhost:${process.env.PORT}`,
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

    await server.listen(PORT, '0.0.0.0');
    console.log(`Servidor Fastify rodando em http://localhost:${process.env.PORT}`);
    console.log(`Documentação disponível em http://localhost:${process.env.PORT}/docs`);

    if (process.env.NGROK_AUTH_TOKEN)
    {
      const url = await ngrok.connect(
      {
        addr: process.env.PORT,
        authtoken: process.env.NGROK_AUTH_TOKEN,
      });
      console.log(`Servidor Fastify exposto publicamente em ${url}`);
      console.log(`Documentação disponível em ${url}/docs`);
    }
    else
    {
      console.warn('Ngrok não iniciado: variável NGROK_AUTH_TOKEN não definida.');
    }
  }
  catch (err)
  {
    server.log.error(err);
    process.exit(1);
  }
};

start();
