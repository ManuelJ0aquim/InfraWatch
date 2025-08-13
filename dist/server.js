"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const fastify_swagger_1 = __importDefault(require("fastify-swagger"));
const RegisterAllRoutes_1 = require("./AllRoutes/RegisterAllRoutes");
const worker_1 = require("./Monitoring/Workers/worker");
const http_1 = __importDefault(require("http"));
const socket_1 = require("./socket");
const server = (0, fastify_1.default)({
    logger: false,
});
server.register(fastify_swagger_1.default, {
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
        await (0, RegisterAllRoutes_1.RegisterAllRoutes)(server);
        const httpServer = http_1.default.createServer(server.server);
        // Inicializa Socket.IO e guarda a instância
        (0, socket_1.initSocket)(httpServer);
        (0, worker_1.startMonitoring)();
        await server.listen({ port: 3000 });
        console.log('Servidor rodando em http://localhost:3000');
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
