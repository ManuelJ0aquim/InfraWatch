import { PrismaClient, ServiceType, Status } from '@prisma/client';
import { SliService } from '../Sla/sli.service';

const prisma = new PrismaClient();
const sliService = new SliService(prisma);

export interface MonitoringResult {
    status: Status;
    responseMs?: number;
    totalMs?: number;
    avgMs?: number;
    httpStatus?: number;
    lossPercent?: number;
    sysName?: string;
    sysDescr?: string;
}

export class SLIIntegration {
    static async processMonitoringResult(serviceId: string, serviceType: ServiceType, result: MonitoringResult) {
        try {
            const sliData = this.calculateSLI(serviceType, result);
            
            if (sliData) {
                await sliService.createSLI(serviceId, sliData.achieved, sliData.target);
                console.log(`✅ SLI criado para serviço ${serviceId}: achieved=${sliData.achieved}, target=${sliData.target}`);
            }
        } catch (error) {
            console.error(`❌ Erro ao criar SLI para serviço ${serviceId}:`, error);
        }
    }

    private static calculateSLI(serviceType: ServiceType, result: MonitoringResult): { achieved: number; target: number } | null {
        switch (serviceType) {
            case ServiceType.HTTP:
                return this.calculateHttpSLI(result);
            
            case ServiceType.PING:
                return this.calculatePingSLI(result);
            
            case ServiceType.SNMP:
                return this.calculateSnmpSLI(result);
            
            case ServiceType.WEBHOOK:
                return this.calculateWebhookSLI(result);
            
            default:
                return null;
        }
    }

    private static calculateHttpSLI(result: MonitoringResult): { achieved: number; target: number } {
        const target = 100;
        
        if (result.status === Status.UP) {
            const responseTime = result.totalMs || result.responseMs || 0;
            
            if (responseTime > 2000) {
                return { achieved: 75, target };
            } else if (responseTime > 1000) {
                return { achieved: 90, target };
            } else {
                return { achieved: 100, target };
            }
        } else {
            return { achieved: 0, target };
        }
    }

    
    //Calcula SLI para serviços PING baseado na disponibilidade e perda de pacotes
    private static calculatePingSLI(result: MonitoringResult): { achieved: number; target: number } {
        const target = 100;
        
        if (result.status === Status.UP) {
            const lossPercent = result.lossPercent || 0;
            
            const achieved = Math.max(0, 100 - lossPercent);
            return { achieved, target };
        } else {
            return { achieved: 0, target };
        }
    }


    //Calcula SLI para serviços SNMP Baseado na disponibilidade e completude dos dados
    private static calculateSnmpSLI(result: MonitoringResult): { achieved: number; target: number } {
        const target = 100;
        
        if (result.status === Status.UP) {
            let achieved = 100;
            
            if (!result.sysName) {
                achieved -= 25;
            }
            if (!result.sysDescr) {
                achieved -= 25;
            }
            
            return { achieved: Math.max(0, achieved), target };
        } else {
            return { achieved: 0, target };
        }
    }

    //Calcula SLI para serviços WEBHOOK Baseado na disponibilidade e código de resposta HTTP
    private static calculateWebhookSLI(result: MonitoringResult): { achieved: number; target: number } {
        const target = 100;
        
        if (result.status === Status.UP && result.httpStatus) {
            if (result.httpStatus >= 200 && result.httpStatus < 300) {
                return { achieved: 100, target };
            } else if (result.httpStatus >= 300 && result.httpStatus < 400) {
                return { achieved: 80, target };
            } else if (result.httpStatus >= 400 && result.httpStatus < 500) {
                return { achieved: 25, target };
            } else {
                return { achieved: 0, target };
            }
        } else {
            return { achieved: 0, target };
        }
    }

    //Processa múltiplos resultados de monitoramento em lote
    static async processBatchResults(results: Array<{ serviceId: string; serviceType: ServiceType; result: MonitoringResult }>) {
        const promises = results.map(({ serviceId, serviceType, result }) =>
            this.processMonitoringResult(serviceId, serviceType, result)
        );

        await Promise.allSettled(promises);
    }

    //Calcula estatísticas de SLI para um período
    static async getSLIStatistics(serviceId: string, hours: number = 24) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (hours * 60 * 60 * 1000));

        try {
            const slis = await sliService.getSLIs(serviceId, startDate, endDate);
            
            if (slis.length === 0) {
                return {
                    count: 0,
                    averageAchieved: 0,
                    averageTarget: 0,
                    availability: 0
                };
            }

            const totalAchieved = slis.reduce((sum, sli) => sum + sli.achieved, 0);
            const totalTarget = slis.reduce((sum, sli) => sum + sli.target, 0);
            
            return {
                count: slis.length,
                averageAchieved: Number((totalAchieved / slis.length).toFixed(2)),
                averageTarget: Number((totalTarget / slis.length).toFixed(2)),
                availability: Number(((totalAchieved / totalTarget) * 100).toFixed(2))
            };
        } catch (error) {
            console.error(`Erro ao calcular estatísticas de SLI para serviço ${serviceId}:`, error);
            return null;
        }
    }
}

//Função utilitária para integrar com o sistema de monitoramento existente
export async function integrateWithMonitoring(serviceId: string, serviceType: ServiceType, monitoringResult: any) {
    const normalizedResult: MonitoringResult = {
        status: monitoringResult.status || Status.DOWN,
        responseMs: monitoringResult.responseMs,
        totalMs: monitoringResult.totalMs,
        avgMs: monitoringResult.avgMs,
        httpStatus: monitoringResult.httpStatus,
        lossPercent: monitoringResult.lossPercent,
        sysName: monitoringResult.sysName,
        sysDescr: monitoringResult.sysDescr
    };

    await SLIIntegration.processMonitoringResult(serviceId, serviceType, normalizedResult);
}

//Função para configurar integração automática
export function enableAutoSLIGeneration() {
    console.log('🔗 Integração automática de SLI habilitada');
}

//Função para gerar SLIs em blocos para todos os serviços
export async function generateBatchSLIs() {
    try {
        console.log('🔄 Gerando SLIs em blocos...');
        
        const services = await prisma.service.findMany();
        console.log(`📊 Processando ${services.length} serviços...`);

        let successCount = 0;
        let errorCount = 0;

        for (const service of services) {
            try {
                const simulatedResult: MonitoringResult = {
                    status: service.status,
                    responseMs: service.lastResponseMs || undefined
                };

                await SLIIntegration.processMonitoringResult(service.id, service.type, simulatedResult);
                successCount++;
            } catch (error) {
                console.error(`Erro ao processar serviço ${service.name}:`, error);
                errorCount++;
            }
        }

        console.log(`✅ SLIs gerados: ${successCount} sucessos, ${errorCount} erros`);
        return { successCount, errorCount };
    } catch (error) {
        console.error('Erro na geração de SLIs em lote:', error);
        throw error;
    }
}

