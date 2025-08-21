// src/routes/APIs/slaRoutes.ts
import { FastifyInstance } from "fastify";
import path from "path";
import fs from "fs";
import { SlaService } from "../../Monitoring/SlaTracking/slaService";
import { SlaReportGenerator } from "../../Monitoring/SlaTracking/slaReportGenerator";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function slaRoutes(fastify: FastifyInstance) {
  fastify.get("/sla/:serviceId/:period", async (request, reply) => {
    const { serviceId, period } = request.params as any;
    const { format } = request.query as any;

    // Buscar nome do serviço no banco
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return reply.status(404).send({ error: "Serviço não encontrado" });
    }

    const { start, end } = (SlaService as any).parsePeriod(period);
    const sla = await SlaService.getSlaReport(serviceId, start, end);

    if (format === "pdf") {
      const reportsDir = path.join(process.cwd(), "reports");
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

      const filePath = path.join(
        reportsDir,
        `sla-${service.name}-${period}.pdf`
      );

      await SlaReportGenerator.generatePDF(
        service.name,
        sla,
        start,
        end,
        filePath
      );

      reply.header("Content-Type", "application/pdf");
      reply.header(
        "Content-Disposition",
        `attachment; filename="sla-${service.name}-${period}.pdf"`
      );
      return reply.send(fs.createReadStream(filePath));
    }

    // Default = JSON
    return { service: service.name, period, sla };
  });
}
