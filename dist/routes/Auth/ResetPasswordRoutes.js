"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetarSenhaRoutes = resetarSenhaRoutes;
const ResetPassword_1 = require("../../Controllers/Auth/ResetPassword");
async function resetarSenhaRoutes(app) {
    app.post("/resetarSenha", {
        schema: {
            description: "Resetar senha do usuário com token de redefinição",
            tags: ["Auth"],
            body: {
                type: "object",
                required: ["user", "token", "novaSenha", "confirmnovaSenha"],
                properties: {
                    user: { type: "string", description: "Email ou telefone do usuário" },
                    token: { type: "string", description: "Token de redefinição recebido" },
                    novaSenha: { type: "string", description: "Nova senha" },
                    confirmnovaSenha: { type: "string", description: "Confirmação da nova senha" }
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
                401: {
                    type: "object",
                    properties: {
                        error: { type: "string" }
                    }
                },
                403: {
                    type: "object",
                    properties: {
                        error: { type: "string" }
                    }
                }
            }
        },
        handler: ResetPassword_1.resetarSenha
    });
}
