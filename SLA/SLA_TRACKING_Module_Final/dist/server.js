"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const cors_1 = __importDefault(require("@fastify/cors"));
const routes_with_swagger_1 = __importDefault(require("./sla_module/src/SLA_TRACKING/api/routes-with-swagger"));
const server = (0, fastify_1.default)({
    logger: {
        level: 'info',
        transport: {
            target: 'pino-pretty'
        }
    }
});
async function start() {
    try {
        // Register CORS
        await server.register(cors_1.default, {
            origin: true
        });
        // Register Swagger
        await server.register(swagger_1.default, {
            swagger: {
                info: {
                    title: 'SLA Tracking API',
                    description: 'API para rastreamento de SLA (Service Level Agreement)',
                    version: '1.0.0'
                },
                externalDocs: {
                    url: 'https://swagger.io',
                    description: 'Find more info here'
                },
                host: 'localhost:3000',
                schemes: ['http'],
                consumes: ['application/json'],
                produces: ['application/json'],
                tags: [
                    { name: 'SLA Status', description: 'Endpoints para consultar status de SLA' },
                    { name: 'Incidents', description: 'Gerenciamento de incidentes' },
                    { name: 'Maintenance', description: 'Gerenciamento de janelas de manutenção' },
                    { name: 'Policies', description: 'Gerenciamento de políticas de SLA' },
                    { name: 'Violations', description: 'Consulta de violações de SLA' }
                ],
                definitions: {
                    SlaPolicy: {
                        type: 'object',
                        required: ['targetPct', 'period', 'timezone'],
                        properties: {
                            id: { type: 'string', format: 'uuid', description: 'ID único da política' },
                            serviceId: { type: 'string', format: 'uuid', description: 'ID do serviço (obrigatório se systemId não fornecido)' },
                            systemId: { type: 'string', format: 'uuid', description: 'ID do sistema (obrigatório se serviceId não fornecido)' },
                            targetPct: { type: 'number', minimum: 0, maximum: 100, description: 'Percentual de uptime desejado (ex: 99.9)' },
                            period: { type: 'string', enum: ['MONTH'], description: 'Período de avaliação' },
                            timezone: { type: 'string', description: 'Timezone para cálculos (ex: Africa/Luanda)' },
                            activeFrom: { type: 'string', format: 'date-time', description: 'Data de início da política' },
                            activeTo: { type: 'string', format: 'date-time', description: 'Data de fim da política (opcional)' }
                        }
                    },
                    Incident: {
                        type: 'object',
                        required: ['startedAt'],
                        properties: {
                            id: { type: 'string', format: 'uuid', description: 'ID único do incidente' },
                            serviceId: { type: 'string', format: 'uuid', description: 'ID do serviço' },
                            startedAt: { type: 'string', format: 'date-time', description: 'Data/hora de início do incidente' },
                            endedAt: { type: 'string', format: 'date-time', description: 'Data/hora de fim do incidente (opcional se ainda ativo)' },
                            isPlanned: { type: 'boolean', default: false, description: 'Se o incidente foi planejado' }
                        }
                    },
                    MaintenanceWindow: {
                        type: 'object',
                        required: ['startsAt', 'endsAt'],
                        properties: {
                            id: { type: 'string', format: 'uuid', description: 'ID único da janela de manutenção' },
                            serviceId: { type: 'string', format: 'uuid', description: 'ID do serviço' },
                            startsAt: { type: 'string', format: 'date-time', description: 'Data/hora de início da manutenção' },
                            endsAt: { type: 'string', format: 'date-time', description: 'Data/hora de fim da manutenção' },
                            reason: { type: 'string', description: 'Motivo da manutenção' }
                        }
                    },
                    SlaStatus: {
                        type: 'object',
                        properties: {
                            serviceId: { type: 'string', format: 'uuid' },
                            period: { type: 'string', description: 'Período consultado (ex: 2025-08)' },
                            uptimePercent: { type: 'number', description: 'Percentual de uptime atual' },
                            targetPercent: { type: 'number', description: 'Percentual de uptime alvo' },
                            status: { type: 'string', enum: ['OK', 'AT_RISK', 'BREACHED'], description: 'Status atual do SLA' },
                            budgetMinutes: { type: 'number', description: 'Orçamento de downtime em minutos' },
                            usedMinutes: { type: 'number', description: 'Minutos de downtime utilizados' }
                        }
                    }
                }
            }
        });
        // Register Swagger UI
        await server.register(swagger_ui_1.default, {
            routePrefix: '/docs',
            uiConfig: {
                docExpansion: 'full',
                deepLinking: false
            },
            uiHooks: {
                onRequest: function (request, reply, next) { next(); },
                preHandler: function (request, reply, next) { next(); }
            },
            staticCSP: true,
            transformStaticCSP: (header) => header,
            transformSpecification: (swaggerObject, request, reply) => { return swaggerObject; },
            transformSpecificationClone: true
        });
        // Add route schemas - removido para evitar erro de compilação
        // server.addSchema({
        //   $id: 'slaPolicy',
        //   ...server.getSchema('SlaPolicy')
        // });
        // Register SLA routes
        await server.register(routes_with_swagger_1.default);
        // Health check endpoint
        server.get('/health', {
            schema: {
                description: 'Health check endpoint',
                tags: ['Health'],
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            status: { type: 'string' },
                            timestamp: { type: 'string', format: 'date-time' }
                        }
                    }
                }
            }
        }, async (request, reply) => {
            return {
                status: 'ok',
                timestamp: new Date().toISOString()
            };
        });
        // Start the server
        const address = await server.listen({
            port: 3000,
            host: '0.0.0.0'
        });
        console.log(`\\n🚀 Servidor rodando em: ${address}`);
        console.log(`📚 Swagger UI disponível em: http://localhost:3000/docs`);
        console.log(`🏥 Health check em: http://localhost:3000/health`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}
start();
//# sourceMappingURL=server.js.map