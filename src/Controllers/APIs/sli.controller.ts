import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { SliService } from '../../Sla/sli.service';
import { validateSLIValues } from '../../Sla/sla.middleware';
import { generateBatchSLIs } from '../../Sla/sli.integration';
import { CreateSLIParams, GetSLIParams } from '../../Sla/interface/sla.interface';

const prisma = new PrismaClient();
const sliService = new SliService(prisma);


export async function createSLI(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { serviceId, achieved, target } = request.body as CreateSLIParams;

        if (!serviceId || achieved === undefined || target === undefined) {
            return reply.status(400).send({
                error: 'Todos os campos são obrigatórios: serviceId, achieved, target'
            });
        }

        const validation = validateSLIValues(achieved, target);
        if (!validation.isValid) {
            return reply.status(400).send({
                error: validation.error
            });
        }

        const service = await prisma.service.findUnique({
            where: { id: serviceId }
        });

        if (!service) {
            return reply.status(404).send({
                error: 'Serviço não encontrado'
            });
        }

        const sli = await sliService.createSLI(serviceId, achieved, target);

        reply.status(201).send({
            message: 'SLI criado com sucesso',
            data: sli
        });
    } catch (error) {
        console.error('Erro ao criar SLI:', error);
        reply.status(500).send({
            error: 'Erro interno do servidor'
        });
    }
}

export async function getSLIs(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { serviceId } = request.params as GetSLIParams;
        const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };

        if (!serviceId) {
            return reply.status(400).send({
                error: 'serviceId é obrigatório'
            });
        }

        const service = await prisma.service.findUnique({
            where: { id: serviceId }
        });

        if (!service) {
            return reply.status(404).send({
                error: 'Serviço não encontrado'
            });
        }

        const now = new Date();
        const defaultStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const defaultEndDate = new Date(now.getFullYear(), now.getMonth(), 0);

        const start = startDate ? new Date(startDate) : defaultStartDate;
        const end = endDate ? new Date(endDate) : defaultEndDate;

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return reply.status(400).send({
                error: 'Formato de data inválido. Use ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)'
            });
        }

        if (start >= end) {
            return reply.status(400).send({
                error: 'startDate deve ser anterior a endDate'
            });
        }

        const slis = await sliService.getSLIs(serviceId, start, end);

        reply.send({
            message: 'SLIs recuperados com sucesso',
            data: slis,
            period: {
                startDate: start.toISOString(),
                endDate: end.toISOString()
            }
        });
    } catch (error) {
        console.error('Erro ao recuperar SLIs:', error);
        reply.status(500).send({
            error: 'Erro interno do servidor'
        });
    }
}

export async function generateSLIsBatch(request: FastifyRequest, reply: FastifyReply) {
    try {
        console.log('🔄 Gerando SLIs em lote...');
        const result = await generateBatchSLIs();

        reply.send({
            message: 'Geração de SLIs em lote concluída',
            data: result
        });
    } catch (error) {
        console.error('Erro ao gerar SLIs em lote:', error);
        reply.status(500).send({
            error: 'Erro interno do servidor'
        });
    }
}

export async function getDashboardData(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { userId } = request.query as { userId?: string };
        
        const targetUserId = userId || (request as any).user?.id;
        
        if (!targetUserId) {
            return reply.status(400).send({
                error: 'Usuário não identificado'
            });
        }

        const services = await prisma.service.findMany({
            where: { ownerId: targetUserId },
            select: {
                id: true,
                name: true,
                type: true,
                status: true,
                _count: {
                    select: {
                        slas: true,
                        slis: true
                    }
                }
            }
        });

        const totalServices = services.length;
        const upServices = services.filter(s => s.status === 'UP').length;
        const downServices = services.filter(s => s.status === 'DOWN').length;

        const recentSLAs = await prisma.sla.findMany({
            where: {
                service: {
                    ownerId: targetUserId
                }
            },
            include: {
                service: {
                    select: {
                        name: true,
                        type: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            },
            take: 10
        });

        const totalSLAs = recentSLAs.length;
        const metSLAs = recentSLAs.filter(sla => sla.status === 'MET').length;
        const breachedSLAs = recentSLAs.filter(sla => sla.status === 'BREACHED').length;
        const pendingSLAs = recentSLAs.filter(sla => sla.status === 'PENDING').length;

        reply.send({
            message: 'Dados do dashboard recuperados com sucesso',
            data: {
                summary: {
                    totalServices,
                    upServices,
                    downServices,
                    healthPercentage: totalServices > 0 ? Number(((upServices / totalServices) * 100).toFixed(2)) : 0
                },
                slaOverview: {
                    totalSLAs,
                    metSLAs,
                    breachedSLAs,
                    pendingSLAs,
                    successRate: totalSLAs > 0 ? Number(((metSLAs / totalSLAs) * 100).toFixed(2)) : 0
                },
                services: services,
                recentSLAs: recentSLAs.map(sla => ({
                    id: sla.id,
                    serviceName: sla.service.name,
                    serviceType: sla.service.type,
                    targetSli: sla.targetSli,
                    achievedSli: sla.achievedSli,
                    status: sla.status,
                    periodStart: sla.periodStart,
                    periodEnd: sla.periodEnd,
                    updatedAt: sla.updatedAt
                }))
            }
        });
    } catch (error) {
        console.error('Erro ao recuperar dados do dashboard:', error);
        reply.status(500).send({
            error: 'Erro interno do servidor'
        });
    }
}