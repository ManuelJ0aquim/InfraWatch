import { PrismaClient } from '@prisma/client';
import { SliService } from './sli.service';
import { SlaService } from './sla.service';

const prisma = new PrismaClient();
const sliService = new SliService(prisma);
const slaService = new SlaService(prisma, sliService);

interface UpdateSLAOptions {
    serviceId?: string;
    createMissing?: boolean;
    updatePending?: boolean;
}

async function updateAllSLAs(options: UpdateSLAOptions = {}) {
    const {
        serviceId = null,
        createMissing = true,
        updatePending = true
    } = options;

    try {
        console.log('🔄 Iniciando atualização de SLAs...');
        
        const services = await prisma.service.findMany({
            where: serviceId ? { id: serviceId } : {},
            select: {
                id: true,
                name: true,
                target: true
            }
        });

        if (services.length === 0) {
            console.log('❌ Nenhum serviço encontrado');
            return;
        }

        console.log(`📊 Processando ${services.length} serviço(s)...`);

        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        let createdCount = 0;
        let updatedCount = 0;
        let errorCount = 0;

        for (const service of services) {
            try {
                console.log(`🔍 Processando serviço: ${service.name} (${service.id})`);

                if (createMissing) {
                    const existingSLA = await prisma.sla.findFirst({
                        where: {
                            serviceId: service.id,
                            periodStart: periodStart,
                            periodEnd: periodEnd
                        }
                    });

                    if (!existingSLA) {
                        try {
                            const targetSli = parseFloat(service.target);
                            if (isNaN(targetSli) || targetSli < 0 || targetSli > 100) {
                                console.log(`⚠️  Target inválido para o serviço ${service.name}: ${service.target}`);
                                continue;
                            }

                            await slaService.createSLA(service.id, periodStart, periodEnd, targetSli);
                            createdCount++;
                            console.log(`✅ SLA criado para ${service.name}`);
                        } catch (createError) {
                            console.error(`❌ Erro ao criar SLA para ${service.name}:`, createError);
                            errorCount++;
                        }
                    }
                }
            } catch (serviceError) {
                console.error(`❌ Erro ao processar serviço ${service.name}:`, serviceError);
                errorCount++;
            }
        }

        if (updatePending) {
            console.log('🔄 Atualizando SLAs pendentes...');
            
            const whereClause: any = { status: 'PENDING' };
            if (serviceId) {
                whereClause.serviceId = serviceId;
            }

            const pendingSLAs = await prisma.sla.findMany({
                where: whereClause,
                include: {
                    service: {
                        select: {
                            name: true
                        }
                    }
                }
            });

            console.log(`📋 Encontrados ${pendingSLAs.length} SLA(s) pendente(s)`);

            for (const sla of pendingSLAs) {
                try {
                    await slaService.updateSLAStatus(sla.id);
                    updatedCount++;
                    console.log(`✅ SLA atualizado para ${sla.service.name}`);
                } catch (updateError) {
                    console.error(`❌ Erro ao atualizar SLA ${sla.id}:`, updateError);
                    errorCount++;
                }
            }
        }

        console.log('\n📊 Relatório de Atualização:');
        console.log(`✅ SLAs criados: ${createdCount}`);
        console.log(`🔄 SLAs atualizados: ${updatedCount}`);
        console.log(`❌ Erros: ${errorCount}`);
        console.log(`⏰ Período processado: ${periodStart.toISOString().split('T')[0]} a ${periodEnd.toISOString().split('T')[0]}`);
        
        if (errorCount === 0) {
            console.log('🎉 Atualização concluída com sucesso!');
        } else {
            console.log('⚠️  Atualização concluída com alguns erros. Verifique os logs acima.');
        }

    } catch (error) {
        console.error('💥 Erro crítico na atualização de SLAs:', error);
        throw error;
    }
}

async function runUpdate(options?: UpdateSLAOptions) {
    try {
        await updateAllSLAs(options);
    } catch (error) {
        console.error('Erro na execução:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

export function scheduleAutoUpdates(intervalMinutes: number = 60) {
    console.log(`⏰ Agendando atualizações automáticas a cada ${intervalMinutes} minutos`);
    
    setInterval(async () => {
        console.log('\n🔔 Executando atualização automática...');
        try {
            await updateAllSLAs({
                createMissing: true,
                updatePending: true
            });
        } catch (error) {
            console.error('Erro na atualização automática:', error);
        }
    }, intervalMinutes * 60 * 1000);
}

export async function cleanupOldSLAs(olderThanDays: number = 365) {
    try {
        console.log(`🧹 Limpando SLAs mais antigos que ${olderThanDays} dias...`);
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const result = await prisma.sla.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate
                }
            }
        });

        console.log(`🗑️  ${result.count} SLA(s) antigo(s) removido(s)`);
        return result.count;
    } catch (error) {
        console.error('Erro ao limpar SLAs antigos:', error);
        throw error;
    }
}

export { updateAllSLAs };

if (require.main === module) {
    const args = process.argv.slice(2);
    const serviceId = args.find(arg => arg.startsWith('--service='))?.split('=')[1];
    const createMissing = !args.includes('--no-create');
    const updatePending = !args.includes('--no-update');

    runUpdate({
        serviceId,
        createMissing,
        updatePending
    });
}

