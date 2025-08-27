import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { writeWebhookMetrics } from "../../Influxdb/WriteMetrics/WriteWebhookMetrics";
import { CheckWebhookPassive } from "../../Monitoring/Checkers/CheckWEBHOOKPASSIVE.ts";
import { writeWebhookEvent } from "../../Influxdb/WriteMetrics/WriteWebhookEvent";

const prisma = new PrismaClient();

export async function webhookReceiverRoutes(app: FastifyInstance) {
  app.post("/api/webhooks/:serviceId", {
    schema: {
      tags: ["Webhooks"],
      summary: "Recebe eventos de serviços via Webhook",
      description: "Recebe payloads externos, grava eventos e métricas no InfluxDB.",
      params: {
        type: "object",
        properties: {
          serviceId: { type: "string", format: "uuid" }
        },
        required: ["serviceId"]
      },
      body: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["UP", "DOWN", "UNKNOWN"], description: "Status do serviço" },
          durationMs: { type: "integer", minimum: 0, description: "Tempo de resposta em ms" },
          httpStatus: { type: "integer", description: "Código de status HTTP" },
          msg: { type: "string", description: "Mensagem descritiva ou nota" },
          ip: { type: "string", description: "Endereço IP do serviço monitorado" },
          sizeBytes: { type: "integer", description: "Tamanho da resposta em bytes" },
          dnsMs: { type: "integer", description: "Tempo de resolução DNS em ms" },
          connectAndDownloadMs: { type: "integer", description: "Tempo total de conexão e download em ms" },
          headers: { type: "object", additionalProperties: { type: "string" }, description: "Cabeçalhos HTTP recebidos" },
          responseBody: { type: "string", description: "Corpo da resposta recebida" }
        },
        required: ["status"]
      },
      response: {
        200: {
          description: "Evento processado com sucesso",
          type: "object",
          properties: {
            ok: { type: "boolean" },
            processed: {
              type: "object",
              properties: {
                status: { type: "string" },
                totalMs: { type: "integer" },
                httpStatus: { type: "integer" },
                description: { type: "string" },
                ip: { type: "string" },
                sizeBytes: { type: "integer" },
                dnsMs: { type: "integer" },
                connectAndDownloadMs: { type: "integer" },
                headers: { type: "object" },
                payloadSent: { type: "object" },
                responseBody: { type: "string" }
              }
            }
          }
        },
        404: {
          description: "Serviço não encontrado",
          type: "object",
          properties: {
            error: { type: "string" }
          }
        },
        500: {
          description: "Erro interno",
          type: "object",
          properties: {
            error: { type: "string" }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { serviceId } = request.params as { serviceId: string };
    const payload = request.body as any;

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return reply.code(404).send({ error: "Service not found" });
    }

    await writeWebhookEvent({
      serviceId,
      payload,
      sourceIp: request.ip,
      userAgent: request.headers["user-agent"],
      status: payload.status,
      note: payload.msg,
    });

    const result = CheckWebhookPassive(payload);

    return { ok: true, processed: result };
  });
}
