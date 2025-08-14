import { PrismaClient } from '@prisma/client';
import { SliService } from './sli.service';
import { SlaService } from './sla.service';
import { updateAllSLAs, scheduleAutoUpdates } from './update-slas';

interface SLAConfig {
    autoUpdateEnabled: boolean;
    autoUpdateIntervalMinutes: number;
    createMissingSLAs: boolean;
    updatePendingSLAs: boolean;
    cleanupOldSLAsEnabled: boolean;
    cleanupOlderThanDays: number;
}

export class SLAManager {
    private prisma: PrismaClient;
    private sliService: SliService;
    private slaService: SlaService;
    private config: SLAConfig;
    private updateInterval: NodeJS.Timeout | null = null;

    constructor(prisma: PrismaClient, config: Partial<SLAConfig> = {}) {
        this.prisma = prisma;
        this.sliService = new SliService(prisma);
        this.slaService = new SlaService(prisma, this.sliService);
        this.config = {
            autoUpdateEnabled: true,
            autoUpdateIntervalMinutes: 60,
            createMissingSLAs: true,
            updatePendingSLAs: true,
            cleanupOldSLAsEnabled: false,
            cleanupOlderThanDays: 365,
            ...config
        };
    }

    /**
     * Inicializa o gerenciador de SLAs
     */
    async initialize() {
        console.log('🚀 Inicializando gerenciador de SLAs...');
        
        try {
            await this.runInitialUpdate();
            
            if (this.config.autoUpdateEnabled) {
                this.startAutoUpdates();
            }
            
            console.log('✅ Gerenciador de SLAs inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao inicializar gerenciador de SLAs:', error);
            throw error;
        }
    }

    /**
     * Executa atualização inicial
     */
    private async runInitialUpdate() {
        console.log('🔄 Executando atualização inicial de SLAs...');
        
        await updateAllSLAs({
            createMissing: this.config.createMissingSLAs,
            updatePending: this.config.updatePendingSLAs
        });
    }

    /**
     * Inicia atualizações automáticas
     */
    private startAutoUpdates() {
        console.log(`⏰ Iniciando atualizações automáticas a cada ${this.config.autoUpdateIntervalMinutes} minutos`);
        
        this.updateInterval = setInterval(async () => {
            try {
                console.log('🔄 Executando atualização automática de SLAs...');
                await updateAllSLAs({
                    createMissing: this.config.createMissingSLAs,
                    updatePending: this.config.updatePendingSLAs
                });
            } catch (error) {
                console.error('❌ Erro na atualização automática:', error);
            }
        }, this.config.autoUpdateIntervalMinutes * 60 * 1000);
    }

    /**
     * Para as atualizações automáticas
     */
    stopAutoUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('⏹️  Atualizações automáticas paradas');
        }
    }

    /**
     * Atualiza a configuração do gerenciador
     */
    updateConfig(newConfig: Partial<SLAConfig>) {
        this.config = { ...this.config, ...newConfig };
        
        if (this.config.autoUpdateEnabled && !this.updateInterval) {
            this.startAutoUpdates();
        } else if (!this.config.autoUpdateEnabled && this.updateInterval) {
            this.stopAutoUpdates();
        }
    }

    /**
     * Força uma atualização manual
     */
    async forceUpdate(serviceId?: string) {
        console.log('🔄 Forçando atualização manual de SLAs...');
        
        return await updateAllSLAs({
            serviceId,
            createMissing: this.config.createMissingSLAs,
            updatePending: this.config.updatePendingSLAs
        });
    }

    /**
     * Obtém estatísticas do gerenciador
     */
    async getManagerStatistics() {
        const totalServices = await this.prisma.service.count();
        const totalSLAs = await this.prisma.sla.count();
        const totalSLIs = await this.prisma.sli.count();
        
        const slaStatusCounts = await this.prisma.sla.groupBy({
            by: ['status'],
            _count: true
        });

        const statusBreakdown = slaStatusCounts.reduce((acc, item) => {
            acc[item.status] = item._count;
            return acc;
        }, {} as Record<string, number>);

        return {
            config: this.config,
            isAutoUpdateActive: this.updateInterval !== null,
            statistics: {
                totalServices,
                totalSLAs,
                totalSLIs,
                statusBreakdown
            }
        };
    }

    /**
     * Executa limpeza de dados antigos
     */
    async cleanupOldData() {
        if (!this.config.cleanupOldSLAsEnabled) {
            console.log('🧹 Limpeza de dados antigos está desabilitada');
            return;
        }

        console.log(`🧹 Executando limpeza de SLAs mais antigos que ${this.config.cleanupOlderThanDays} dias...`);
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.cleanupOlderThanDays);

        const [deletedSLAs, deletedSLIs] = await Promise.all([
            this.prisma.sla.deleteMany({
                where: {
                    createdAt: { lt: cutoffDate }
                }
            }),
            this.prisma.sli.deleteMany({
                where: {
                    timestamp: { lt: cutoffDate }
                }
            })
        ]);

        console.log(`🗑️  Removidos ${deletedSLAs.count} SLA(s) e ${deletedSLIs.count} SLI(s) antigo(s)`);
        
        return {
            deletedSLAs: deletedSLAs.count,
            deletedSLIs: deletedSLIs.count
        };
    }

    /**
     * Finaliza o gerenciador
     */
    async shutdown() {
        console.log('⏹️  Finalizando gerenciador de SLAs...');
        
        this.stopAutoUpdates();
        
        console.log('✅ Gerenciador de SLAs finalizado');
    }
}

let slaManagerInstance: SLAManager | null = null;

/**
 * Obtém a instância singleton do gerenciador de SLAs
 */
export function getSLAManager(prisma?: PrismaClient, config?: Partial<SLAConfig>): SLAManager {
    if (!slaManagerInstance) {
        if (!prisma) {
            throw new Error('Prisma client é obrigatório na primeira inicialização');
        }
        slaManagerInstance = new SLAManager(prisma, config);
    }
    return slaManagerInstance;
}

/**
 * Inicializa o gerenciador de SLAs globalmente
 */
export async function initializeSLAManager(prisma: PrismaClient, config?: Partial<SLAConfig>) {
    const manager = getSLAManager(prisma, config);
    await manager.initialize();
    return manager;
}
