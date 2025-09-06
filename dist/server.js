"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const localtunnel_1 = __importDefault(require("localtunnel"));
const socket_1 = require("./socket");
const fastify_swagger_1 = __importDefault(require("fastify-swagger"));
const worker_1 = require("./Monitoring/Workers/worker");
const RegisterRoutes_1 = require("./RegisterRoutes/RegisterRoutes");
const PORT = Number(process.env.PORT) || 3000;
const SUBDOMAIN = process.env.LOCALTUNNEL_SUBDOMAIN;
const server = (0, fastify_1.default)({ logger: false });
server.register(fastify_swagger_1.default, {
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
    try {
        (0, RegisterRoutes_1.RegisterAllRoutes)(server);
        (0, socket_1.initSocket)(server.server);
        await (0, worker_1.startMonitoring)();
        await server.listen(PORT, '0.0.0.0');
        console.log(`Servidor Fastify rodando em http://localhost:${PORT}`);
        console.log(`Documentação disponível em http://localhost:${PORT}/docs`);
        const tunnel = await (0, localtunnel_1.default)({ port: PORT, subdomain: SUBDOMAIN });
        console.log(`Servidor exposto publicamente em ${tunnel.url}`);
        console.log(`Documentação disponível em ${tunnel.url}/docs`);
        tunnel.on('close', () => {
            console.log('Túnel Localtunnel fechado');
        });
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
