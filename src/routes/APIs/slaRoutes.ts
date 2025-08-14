import { FastifyInstance } from 'fastify';
import {
    createSLA,
    updateSLAStatus,
    getSLAs,
    getSLAById,
    createSLI,
    getSLIs,
    calculateSLA,
    getSLAStatistics,
    getDashboardData,
    forceSLAUpdate,
    getManagerStatus,
    generateSLIsBatch
} from '../../Controllers/APIs/sla';

async function slaRoutes(fastify: FastifyInstance) {
    
    fastify.post('/sla', {
    fastify.post('/sla', {
        schema: {
            description: 'Criar um novo SLA para um serviço',
            tags: ['SLA'],
            body: {
                type: 'object',
                required: ['serviceId', 'targetSli', 'periodStart', 'periodEnd'],
                properties: {
                    serviceId: { type: 'string' },
                    targetSli: { 
                        type: 'number',
                        minimum: 0,
                        maximum: 100,
                        description: 'Meta de SLI em percentual (0-100)'
                    },
                    periodStart: { 
                        type: 'string',
                        format: 'date-time',
                        description: 'Data de início do período (ISO 8601)'
                    },
                    periodEnd: { 
                        type: 'string',
                        format: 'date-time',
                        description: 'Data de fim do período (ISO 8601)'
                    }
                }
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                serviceId: { type: 'string' },
                                targetSli: { type: 'number' },
                                achievedSli: { type: 'number' },
                                periodStart: { type: 'string' },
                                periodEnd: { type: 'string' },
                                status: { type: 'string' },
                                createdAt: { type: 'string' },
                                updatedAt: { type: 'string' }
                            }
                        }
                    }
                },
                400: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                }
            }
        }
    }, createSLA);

    fastify.put('/sla/:slaId/status', {
        schema: {
            description: 'Atualizar o status de um SLA baseado nos SLIs atuais',
            tags: ['SLA'],
            params: {
                type: 'object',
                properties: {
                    slaId: { type: 'string' }
                },
                required: ['slaId']
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                serviceId: { type: 'string' },
                                targetSli: { type: 'number' },
                                achievedSli: { type: 'number' },
                                periodStart: { type: 'string' },
                                periodEnd: { type: 'string' },
                                status: { type: 'string' },
                                updatedAt: { type: 'string' }
                            }
                        }
                    }
                },
                404: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                }
            }
        }
    }, updateSLAStatus);

    fastify.get('/sla/service/:serviceId', {
        schema: {
            description: 'Listar todos os SLAs de um serviço específico',
            tags: ['SLA'],
            params: {
                type: 'object',
                properties: {
                    serviceId: { type: 'string' }
                },
                required: ['serviceId']
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    serviceId: { type: 'string' },
                                    targetSli: { type: 'number' },
                                    achievedSli: { type: 'number' },
                                    periodStart: { type: 'string' },
                                    periodEnd: { type: 'string' },
                                    status: { type: 'string' },
                                    createdAt: { type: 'string' },
                                    updatedAt: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, getSLAs);

    fastify.get('/sla/:slaId', {
        schema: {
            description: 'Obter detalhes de um SLA específico',
            tags: ['SLA'],
            params: {
                type: 'object',
                properties: {
                    slaId: { type: 'string' }
                },
                required: ['slaId']
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                serviceId: { type: 'string' },
                                targetSli: { type: 'number' },
                                achievedSli: { type: 'number' },
                                periodStart: { type: 'string' },
                                periodEnd: { type: 'string' },
                                status: { type: 'string' },
                                service: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        name: { type: 'string' },
                                        type: { type: 'string' },
                                        target: { type: 'string' }
                                    }
                                },
                                createdAt: { type: 'string' },
                                updatedAt: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    }, getSLAById);

    fastify.get('/sla/service/:serviceId/calculate', {
        schema: {
            description: 'Calcular SLA para um serviço em um período específico',
            tags: ['SLA'],
            params: {
                type: 'object',
                properties: {
                    serviceId: { type: 'string' }
                },
                required: ['serviceId']
            },
            querystring: {
                type: 'object',
                properties: {
                    startDate: { 
                        type: 'string',
                        format: 'date-time',
                        description: 'Data de início (opcional, padrão: início do mês anterior)'
                    },
                    endDate: { 
                        type: 'string',
                        format: 'date-time',
                        description: 'Data de fim (opcional, padrão: fim do mês anterior)'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                serviceId: { type: 'string' },
                                serviceName: { type: 'string' },
                                period: {
                                    type: 'object',
                                    properties: {
                                        startDate: { type: 'string' },
                                        endDate: { type: 'string' }
                                    }
                                },
                                slaPercentage: { type: 'number' },
                                averageSLI: { type: 'number' }
                            }
                        }
                    }
                }
            }
        }
    }, calculateSLA);

    fastify.post('/sli', {
        schema: {
            description: 'Criar um novo registro de SLI',
            tags: ['SLI'],
            body: {
                type: 'object',
                required: ['serviceId', 'achieved', 'target'],
                properties: {
                    serviceId: { type: 'string' },
                    achieved: { 
                        type: 'number',
                        minimum: 0,
                        description: 'Valor alcançado do SLI'
                    },
                    target: { 
                        type: 'number',
                        minimum: 0,
                        description: 'Valor alvo do SLI'
                    }
                }
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                serviceId: { type: 'string' },
                                achieved: { type: 'number' },
                                target: { type: 'number' },
                                timestamp: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    }, createSLI);

    fastify.get('/sli/service/:serviceId', {
        schema: {
            description: 'Listar SLIs de um serviço em um período específico',
            tags: ['SLI'],
            params: {
                type: 'object',
                properties: {
                    serviceId: { type: 'string' }
                },
                required: ['serviceId']
            },
            querystring: {
                type: 'object',
                properties: {
                    startDate: { 
                        type: 'string',
                        format: 'date-time',
                        description: 'Data de início (opcional, padrão: início do mês anterior)'
                    },
                    endDate: { 
                        type: 'string',
                        format: 'date-time',
                        description: 'Data de fim (opcional, padrão: fim do mês anterior)'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    serviceId: { type: 'string' },
                                    achieved: { type: 'number' },
                                    target: { type: 'number' },
                                    timestamp: { type: 'string' }
                                }
                            }
                        },
                        period: {
                            type: 'object',
                            properties: {
                                startDate: { type: 'string' },
                                endDate: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    }, getSLIs);

    fastify.get('/sla/service/:serviceId/statistics', {
        schema: {
            description: 'Obter estatísticas detalhadas de SLA para um serviço',
            tags: ['SLA'],
            params: {
                type: 'object',
                properties: {
                    serviceId: { type: 'string' }
                },
                required: ['serviceId']
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                service: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        name: { type: 'string' }
                                    }
                                },
                                statistics: {
                                    type: 'object',
                                    properties: {
                                        totalSLAs: { type: 'number' },
                                        metSLAs: { type: 'number' },
                                        breachedSLAs: { type: 'number' },
                                        pendingSLAs: { type: 'number' },
                                        successRate: { type: 'number' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, getSLAStatistics);

    fastify.get('/dashboard', {
        schema: {
            description: 'Obter dados consolidados para o dashboard de SLAs',
            tags: ['Dashboard'],
            querystring: {
                type: 'object',
                properties: {
                    userId: { 
                        type: 'string',
                        description: 'ID do usuário (opcional, usa o usuário autenticado se não especificado)'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                summary: {
                                    type: 'object',
                                    properties: {
                                        totalServices: { type: 'number' },
                                        upServices: { type: 'number' },
                                        downServices: { type: 'number' },
                                        healthPercentage: { type: 'number' }
                                    }
                                },
                                slaOverview: {
                                    type: 'object',
                                    properties: {
                                        totalSLAs: { type: 'number' },
                                        metSLAs: { type: 'number' },
                                        breachedSLAs: { type: 'number' },
                                        pendingSLAs: { type: 'number' },
                                        successRate: { type: 'number' }
                                    }
                                },
                                services: { type: 'array' },
                                recentSLAs: { type: 'array' }
                            }
                        }
                    }
                }
            }
        }
    }, getDashboardData);

    fastify.post('/sla/update', {
        schema: {
            description: 'Forçar atualização manual de SLAs',
            tags: ['Gerenciamento'],
            body: {
                type: 'object',
                properties: {
                    serviceId: { 
                        type: 'string',
                        description: 'ID do serviço específico (opcional, atualiza todos se não especificado)'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                serviceId: { type: 'string' },
                                timestamp: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    }, forceSLAUpdate);

    fastify.get('/sla/manager/status', {
        schema: {
            description: 'Obter status e estatísticas do gerenciador de SLAs',
            tags: ['Gerenciamento'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                config: { type: 'object' },
                                isAutoUpdateActive: { type: 'boolean' },
                                statistics: {
                                    type: 'object',
                                    properties: {
                                        totalServices: { type: 'number' },
                                        totalSLAs: { type: 'number' },
                                        totalSLIs: { type: 'number' },
                                        statusBreakdown: { type: 'object' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, getManagerStatus);

    fastify.post('/sli/generate-batch', {
        schema: {
            description: 'Gerar SLIs em lote para todos os serviços',
            tags: ['SLI'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                successCount: { type: 'number' },
                                errorCount: { type: 'number' }
                            }
                        }
                    }
                }
            }
        }
    }, generateSLIsBatch);
}

export default slaRoutes;
