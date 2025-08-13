import { PrismaClient } from '@prisma/client';
import { SliService } from '../src/Sla/sli.service';
import { SlaService } from '../src/Sla/sla.service';

const prisma = new PrismaClient();
const sliService = new SliService(prisma);
const slaService = new SlaService(prisma, sliService);

async function testServices() {
  try {
    // 1️⃣ Criar usuário
    const user = await prisma.user.create({
      data: {
        name: "Joisson Test",
        email: "joisson@test.com",
        password: "123456",
      },
    });
    console.log("Usuário criado:", user);

    // 2️⃣ Criar serviço
    const service = await prisma.service.create({
      data: {
        name: "Teste Service",
        type: "HTTP",
        target: "https://example.com",
        ownerId: user.id,
      },
    });
    console.log("Serviço criado:", service);

    // 3️⃣ Criar SLI de teste
    const sli = await sliService.createSLI(service.id, 90, 95);
    console.log("SLI criado:", sli);

    // 4️⃣ Calcular média de SLIs no período
    const avg = await sliService.calculateAverageSLI(
      service.id,
      new Date('2025-08-01'),
      new Date('2025-08-31')
    );
    console.log("Média de SLI:", avg);

    // 5️⃣ Criar SLA baseado nos SLIs existentes
    const sla = await slaService.createSLA(
      service.id,
      new Date('2025-08-01'),
      new Date('2025-08-31'),
      95
    );
    console.log("SLA criado:", sla);

    // 6️⃣ Atualizar SLA status
    const updatedSla = await slaService.updateSLAStatus(sla.id);
    console.log("SLA atualizado:", updatedSla);

  } catch (error) {
    console.error("Erro ao testar serviços:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testServices();
