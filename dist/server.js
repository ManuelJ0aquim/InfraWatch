"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const fastify_swagger_1 = __importDefault(require("fastify-swagger"));
const RegisterAllRoutes_1 = require("./AllRoutes/RegisterAllRoutes");
const worker_1 = require("./Monitoring/Workers/worker");
const socket_1 = require("./socket");
const server = (0, fastify_1.default)({
    logger: true, // Ative o logger para ajudar no debug
});
// Configuração do Swagger
server.register(fastify_swagger_1.default, {
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
    try {
        // Registra todas as rotas
        (0, RegisterAllRoutes_1.RegisterAllRoutes)(server); // Remova o await se não for necessário
        // Inicia o monitoramento
        (0, worker_1.startMonitoring)();
        // Inicia o servidor Fastify
        await server.listen(3002, '0.0.0.0');
        console.log('Servidor Fastify rodando em http://localhost:3002');
        // Inicializa Socket.IO usando o servidor interno do Fastify
        (0, socket_1.initSocket)(server.server);
        console.log(`Documentação disponível em http://localhost:3002/docs`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
