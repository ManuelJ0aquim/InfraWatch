import { FastifyInstance } from "fastify";
import { VerifyOTP } from "../../Controllers/Auth/VerifyOTP";

export async function VerifyOTProutes(app: FastifyInstance) {
  app.post("/VerifyOTP", {
    schema: {
      description: "Verifica se o token OTP para resetar senha é válido",
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["user", "token"],
        properties: {
          user: { type: "string", description: "Email do usuário" },
          token: { type: "string", description: "Token OTP enviado para o usuário" },
        },
      },
      response: {
        200: {
          description: "Token válido",
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
        400: {
          description: "Email inválido",
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
        401: {
          description: "OTP inválido",
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
        403: {
          description: "Token expirado",
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
      },
    },
    handler: VerifyOTP,
  });
}
