"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginRoutes = LoginRoutes;
const login_1 = require("../../Controllers/Auth/login");
async function LoginRoutes(fastify) {
    fastify.post('/login', {
        schema: {
            description: 'Login do usuário',
            tags: ['Auth'],
            body: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        token: { type: 'string' }
                    }
                }
            }
        }
    }, login_1.Login);
}
