import { PrismaClient } from '@prisma/client';

export class SliService {
    constructor(private prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async createSLI(serviceId: string, achieved: number, target: number){
        return this.prisma.sli.create({data: {serviceId, achieved, target,},});
    }

    async getSLIs(serviceId: string, startDate: Date, endDate: Date){
        return this.prisma.sli.findMany({where: {serviceId, timestamp: {gte: startDate, lte: endDate,},}, orderBy: {timestamp: 'asc',},});
    }

    async calculateAverageSLI(serviceId: string, startDate: Date, endDate: Date){
        const slis = await this.getSLIs(serviceId, startDate, endDate);

        if (slis.length === 0) {
            console.log("Nenhuma SLI neste período!");
            return 0;
        }
        let total = 0;
        for (let i = 0; i < slis.length; i++) {
            total += slis[i].achieved;
        }
        const result = total / slis.length;
        return result;
    }

    async calculateSLA(serviceId: string, startDate: Date, endDate: Date){
        const slis = await this.getSLIs(serviceId, startDate, endDate);

        if (slis.length === 0) {
            console.log("Nenhuma SLI neste período!");
            return 0;
        }
        let totalAchieved = 0;
        let totalTarget = 0;

        for (let i = 0; i < slis.length; i++) {
            totalAchieved += slis[i].achieved;
            totalTarget += slis[i].target;
        }
        const slaPercentage = (totalAchieved / totalTarget) * 100;
        return slaPercentage;
    }
}

