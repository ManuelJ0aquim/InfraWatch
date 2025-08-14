import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { SliService } from '../../Sla/sli.service';
import { SlaService } from '../../Sla/sla.service';
import { calculateSLAStatistics, validateDateRange, validateSLIValues } from '../../Sla/sla.middleware';
import { getSLAManager } from '../../Sla/sla.manager';
import { generateBatchSLIs, SLIIntegration } from '../../Sla/sli.integration';
import { CreateSLAParams, UpdateSLAParams, GetSLAParams, GetSLAByIdParams, CreateSLIParams, GetSLIParams} from '../../Sla/interface/sla.interface';

const prisma = new PrismaClient();
const sliService = new SliService(prisma);
const slaService = new SlaService(prisma, sliService);

export async function createSLA(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { serviceId, targetSli, periodStart, periodEnd } = request.body as CreateSLAParams;

        if (!serviceId || !targetSli || !periodStart || !periodEnd) {
            return reply.status(400).send({
                error: 'Todos os campos são obrigatórios: serviceId, targetSli, periodStart, periodEnd'
            });
        }

        if (targetSli < 0 || targetSli > 100) {
            return reply.status(400).send({
                error: 'targetSli deve estar entre 0 e 100'
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

        const startDate = new Date(periodStart);
        const endDate = new Date(periodEnd);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return reply.status(400).send({
                error: 'Formato de data inválido. Use ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)'
            });
        }

        if (startDate >= endDate) {
            return reply.status(400).send({
                error: 'periodStart deve ser anterior a periodEnd'
            });
        }

        const existingSLA = await prisma.sla.findFirst({
            where: {
                serviceId,
                periodStart: startDate,
                periodEnd: endDate
            }
        });

        if (existingSLA) {
            return reply.status(409).send({
                error: 'Já existe um SLA para este serviço no período especificado'
            });
        }

        const sla = await slaService.createSLA(serviceId, startDate, endDate, targetSli);

        reply.status(201).send({
            message: 'SLA criado com sucesso',
            data: sla
        });
    } catch (error) {
        console.error('Erro ao criar SLA:', error);
        reply.status(500).send({
            error: 'Erro interno do servidor'
        });
    }
}

export async function updateSLAStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { slaId } = request.params as UpdateSLAParams;

        if (!slaId) {
            return reply.status(400).send({
                error: 'slaId é obrigatório'
            });
        }

        const updatedSLA = await slaService.updateSLAStatus(slaId);

        reply.send({
            message: 'Status do SLA atualizado com sucesso',
            data: updatedSLA
        });
    } catch (error) {
        console.error('Erro ao atualizar status do SLA:', error);
        
        if (error instanceof Error && error.message === 'SLA não encontrado') {
            return reply.status(404).send({
                error: 'SLA não encontrado'
            });
        }

        reply.status(500).send({
            error: 'Erro interno do servidor'
        });
    }
}

export async function getSLAs(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { serviceId } = request.params as GetSLAParams;

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

        const slas = await slaService.getSLAs(serviceId);

        reply.send({
            message: 'SLAs recuperados com sucesso',
            data: slas
        });
    } catch (error) {
        console.error('Erro ao recuperar SLAs:', error);
        reply.status(500).send({
            error: 'Erro interno do servidor'
        });
    }
}

export async function getSLAById(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { slaId } = request.params as GetSLAByIdParams;

        if (!slaId) {
            return reply.status(400).send({
                error: 'slaId é obrigatório'
            });
        }

        const sla = await prisma.sla.findUnique({
            where: { id: slaId },
            include: {
                service: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        target: true
                    }
                }
            }
        });

        if (!sla) {
            return reply.status(404).send({
                error: 'SLA não encontrado'
            });
        }

        reply.send({
            message: 'SLA recuperado com sucesso',
            data: sla
        });
    } catch (error) {
        console.error('Erro ao recuperar SLA:', error);
        reply.status(500).send({
            error: 'Erro interno do servidor'
        });
    }
}

export async function calculateSLA(request: FastifyRequest, reply: FastifyReply) {
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

        const slaPercentage = await sliService.calculateSLA(serviceId, start, end);
        const averageSLI = await sliService.calculateAverageSLI(serviceId, start, end);

        reply.send({
            message: 'SLA calculado com sucesso',
            data: {
                serviceId,
                serviceName: service.name,
                period: {
                    startDate: start.toISOString(),
                    endDate: end.toISOString()
                },
                slaPercentage: Number(slaPercentage.toFixed(2)),
                averageSLI: Number(averageSLI.toFixed(2))
            }
        });
    } catch (error) {
        console.error('Erro ao calcular SLA:', error);
        reply.status(500).send({
            error: 'Erro interno do servidor'
        });
    }
}

export async function getSLAStatistics(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { serviceId } = request.params as { serviceId: string };

        if (!serviceId) {
            return reply.status(400).send({
                error: 'serviceId é obrigatório'
            });
        }

        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            select: { id: true, name: true }
        });

        if (!service) {
            return reply.status(404).send({
                error: 'Serviço não encontrado'
            });
        }

        const statistics = await calculateSLAStatistics(serviceId);

        reply.send({
            message: 'Estatísticas de SLA recuperadas com sucesso',
            data: {
                service: service,
                statistics: statistics
            }
        });
    } catch (error) {
        console.error('Erro ao recuperar estatísticas de SLA:', error);
        reply.status(500).send({
            error: 'Erro interno do servidor'
        });
    }
}

export async function forceSLAUpdate(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { serviceId } = request.body as { serviceId?: string };
        
        console.log('🔄 Forçando atualização de SLAs...');
        const manager = getSLAManager();
        await manager.forceUpdate(serviceId);

        reply.send({
            message: 'Atualização de SLAs executada com sucesso',
            data: {
                serviceId: serviceId || 'todos',
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Erro ao forçar atualização de SLAs:', error);
        reply.status(500).send({
            error: 'Erro interno do servidor'
        });
    }
}

export async function getManagerStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
        const manager = getSLAManager();
        const statistics = await manager.getManagerStatistics();

        reply.send({
            message: 'Status do gerenciador de SLAs recuperado com sucesso',
            data: statistics
        });
    } catch (error) {
        console.error('Erro ao recuperar status do gerenciador:', error);
        reply.status(500).send({
            error: 'Erro interno do servidor'
        });
    }
}