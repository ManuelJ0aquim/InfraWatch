import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function validateServiceAccess(request: FastifyRequest, reply: FastifyReply) {
    try {
        const serviceId = (request.params as any)?.serviceId || (request.body as any)?.serviceId;
        
        if (!serviceId) {
            return reply.status(400).send({
                error: 'serviceId é obrigatório'
            });
        }

        const service = await prisma.service.findFirst({
            where: {
                id: serviceId,
                ownerId: request.user.id
            }
        });

        if (!service) {
            return reply.status(404).send({
                error: 'Serviço não encontrado ou você não tem permissão para acessá-lo'
            });
        }

        (request as any).service = service;
    } catch (error) {
        console.error('Erro na validação de acesso ao serviço:', error);
        return reply.status(500).send({
            error: 'Erro interno do servidor'
        });
    }
}

export async function validateSLAAccess(request: FastifyRequest, reply: FastifyReply) {
    try {
        const slaId = (request.params as any)?.slaId;
        
        if (!slaId) {
            return reply.status(400).send({
                error: 'slaId é obrigatório'
            });
        }

        const sla = await prisma.sla.findFirst({
            where: {
                id: slaId,
                service: {
                    ownerId: request.user.id
                }
            },
            include: {
                service: true
            }
        });

        if (!sla) {
            return reply.status(404).send({
                error: 'SLA não encontrado ou você não tem permissão para acessá-lo'
            });
        }

        (request as any).sla = sla;
    } catch (error) {
        console.error('Erro na validação de acesso ao SLA:', error);
        return reply.status(500).send({
            error: 'Erro interno do servidor'
        });
    }
}

export function validateDateRange(startDate: Date, endDate: Date): { isValid: boolean; error?: string } {
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return {
            isValid: false,
            error: 'Formato de data inválido. Use ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)'
        };
    }

    if (startDate >= endDate) {
        return {
            isValid: false,
            error: 'Data de início deve ser anterior à data de fim'
        };
    }

    const maxPeriod = 365 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > maxPeriod) {
        return {
            isValid: false,
            error: 'Período máximo permitido é de 1 ano'
        };
    }

    const maxAge = 2 * 365 * 24 * 60 * 60 * 1000;
    const now = new Date();
    if (now.getTime() - startDate.getTime() > maxAge) {
        return {
            isValid: false,
            error: 'Data de início não pode ser superior a 2 anos atrás'
        };
    }

    return { isValid: true };
}

export function validateSLIValues(achieved: number, target: number): { isValid: boolean; error?: string } {
    if (achieved < 0 || target < 0) {
        return {
            isValid: false,
            error: 'Valores achieved e target devem ser positivos'
        };
    }

    if (target === 0) {
        return {
            isValid: false,
            error: 'Valor target não pode ser zero'
        };
    }

    const maxValue = 1000000;
    if (achieved > maxValue || target > maxValue) {
        return {
            isValid: false,
            error: 'Valores não podem exceder 1.000.000'
        };
    }

    return { isValid: true };
}

export interface SLAStatistics {
    totalSLAs: number;
    metSLAs: number;
    breachedSLAs: number;
    pendingSLAs: number;
    successRate: number;
}

export async function calculateSLAStatistics(serviceId: string): Promise<SLAStatistics> {
    const slas = await prisma.sla.findMany({
        where: { serviceId }
    });

    const stats: SLAStatistics = {
        totalSLAs: slas.length,
        metSLAs: slas.filter(sla => sla.status === 'MET').length,
        breachedSLAs: slas.filter(sla => sla.status === 'BREACHED').length,
        pendingSLAs: slas.filter(sla => sla.status === 'PENDING').length,
        successRate: 0
    };

    if (stats.totalSLAs > 0) {
        stats.successRate = Number(((stats.metSLAs / stats.totalSLAs) * 100).toFixed(2));
    }

    return stats;
}
