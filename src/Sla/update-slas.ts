import { PrismaClient } from '@prisma/client';
import { SliService } from './sli.service';
import { SlaService } from './sla.service';

const prisma = new PrismaClient();
const sliService = new SliService(prisma);
const slaService = new SlaService(prisma, sliService);

async function updateAllSLAs() {
    const services = await prisma.service.findMany();

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1); // ex: início do mês
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // fim do mês

    for (const service of services) {
        const existingSLA = await prisma.sla.findFirst({
            where: {
                serviceId: service.id,
                periodStart: periodStart,
                periodEnd: periodEnd
            }
        });

        if (!existingSLA) {
            await slaService.createSLA(service.id, periodStart, periodEnd, parseFloat(service.target));
        }
    }
    const pendingSLAs = await prisma.sla.findMany({ where: { status: 'PENDING' }});
    for (const sla of pendingSLAs) {
        await slaService.updateSLAStatus(sla.id);
    }
}

updateAllSLAs().then(() => {
    console.log("SLAs atualizados!");
    prisma.$disconnect();
});

