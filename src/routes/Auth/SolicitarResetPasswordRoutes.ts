import { FastifyInstance } from "fastify";
import { solicitarResetSenha } from "../../Controllers/Auth/SolicitarResetPassword";

export async function solicitarResetSenhaRoutes(app: FastifyInstance) {
  app.post("/solicitarResetSenha", {
    schema: {
      description: "Solicitar token para redefinição de senha",
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["user"],
        properties: {
          user: { type: "string", description: "Email ou telefone do usuário" }
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" }
          }
        },
        400: {
          type: "object",
          properties: {
            error: { type: "string" }
          }
        },
        404: {
          type: "object",
          properties: {
            error: { type: "string" }
          }
        }
      }
    },
    handler: solicitarResetSenha
  });
}
