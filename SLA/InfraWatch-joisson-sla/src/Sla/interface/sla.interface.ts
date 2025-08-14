export interface SLAStatistics {
    totalSLAs: number;
    metSLAs: number;
    breachedSLAs: number;
    pendingSLAs: number;
    successRate: number;
}

export interface SLAConfig {
    autoUpdateEnabled: boolean;
    autoUpdateIntervalMinutes: number;
    createMissingSLAs: boolean;
    updatePendingSLAs: boolean;
    cleanupOldSLAsEnabled: boolean;
    cleanupOlderThanDays: number;
}

export interface CreateSLAParams {
    serviceId: string;
    targetSli: number;
    periodStart: string;
    periodEnd: string;
}

export interface UpdateSLAParams {
    slaId: string;
}

export interface GetSLAParams {
    serviceId: string;
}

export interface GetSLAByIdParams {
    slaId: string;
}

export interface CreateSLIParams {
    serviceId: string;
    achieved: number;
    target: number;
}

export interface GetSLIParams {
    serviceId: string;
    startDate?: string;
    endDate?: string;
}