"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.solicitarResetSenhaRoutes = solicitarResetSenhaRoutes;
const SolicitarResetPassword_1 = require("../../Controllers/Auth/SolicitarResetPassword");
async function solicitarResetSenhaRoutes(app) {
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
        handler: SolicitarResetPassword_1.solicitarResetSenha
    });
}
