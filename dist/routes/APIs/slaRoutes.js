"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slaRoutes = slaRoutes;
const slaService_1 = require("../../Monitoring/SlaTracking/slaService");
const slaReportGenerator_1 = require("../../Monitoring/SlaTracking/slaReportGenerator");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function slaRoutes(app) {
    app.get("/sla/:serviceId/:period", {
        schema: {
            tags: ["SLA"],
            summary: "Gerar relatório de SLA de um serviço",
            params: {
                type: "object",
                properties: {
                    serviceId: { type: "string" },
                    period: {
                        type: "string",
                        description: "Período (ex: 'last-7d', 'last-30d', '2025-01')"
                    },
                },
                required: ["serviceId", "period"],
            },
            querystring: {
                type: "object",
                properties: {
                    format: {
                        type: "string",
                        enum: ["json", "pdf"],
                        default: "json"
                    },
                },
            },
            response: {
                200: {
                    oneOf: [
                        {
                            type: "object",
                            properties: {
                                service: { type: "string" },
                                period: { type: "string" },
                                sla: {
                                    type: "object",
                                    properties: {
                                        uptimePercentage: { type: "number" },
                                        downtimeMinutes: { type: "number" },
                                        incidents: { type: "array", items: { type: "object" } },
                                    },
                                },
                            },
                        },
                        { type: "string", description: "PDF stream" },
                    ],
                },
            },
        },
        handler: async (req, reply) => {
            const { serviceId, period } = req.params;
            const { format } = req.query;
            // Buscar serviço
            const service = await prisma.service.findUnique({ where: { id: serviceId } });
            if (!service)
                return reply.status(404).send({ error: "Serviço não encontrado" });
            // Calcular período e gerar SLA
            const { start, end } = slaService_1.SlaService.parsePeriod(period);
            const sla = await slaService_1.SlaService.getSlaReport(serviceId, start, end);
            if (format === "pdf") {
                const pdfBuffer = await slaReportGenerator_1.SlaReportGenerator.generatePDF(service.name, sla, start, end);
                reply.header("Content-Type", "application/pdf");
                reply.header("Content-Disposition", `attachment; filename="sla-${service.name}-${period}.pdf"`);
                return reply.send(pdfBuffer);
            }
            return { service: service.name, period, sla };
        },
    });
}
