import { PrismaClient } from '@prisma/client';
import { SliService } from './sli.service'; 

export class SlaService {
    constructor(private prisma: PrismaClient, private sliService: SliService) {}

    async createSLA(serviceId: string, periodStart: Date, periodEnd: Date, targetSli: number) {
        const achievedSli = await this.sliService.calculateAverageSLI(serviceId, periodStart, periodEnd);
        const status = achievedSli >= targetSli ? 'MET' : 'PENDING';
        
        return this.prisma.sla.create({
            data: {serviceId, targetSli, achievedSli, periodStart, periodEnd, status,},});
    }

    async updateSLAStatus(slaId: string) {
        const sla = await this.prisma.sla.findUnique({ where: { id: slaId } });
        if (!sla) 
            throw new Error('SLA não encontrado');

        const achievedSli = await this.sliService.calculateAverageSLI(sla.serviceId, sla.periodStart, sla.periodEnd);
        let status: 'PENDING' | 'MET' | 'BREACHED' = 'PENDING';

        if (achievedSli >= sla.targetSli) 
            status = 'MET';
        else status = 'BREACHED';

        return this.prisma.sla.update({where: { id: slaId }, data: { achievedSli, status },});
    }

    async getSLAs(serviceId: string) {
        return this.prisma.sla.findMany({ where: { serviceId }, orderBy: { periodStart: 'asc' },});
    }
}

