"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterRoutes = RegisterRoutes;
const Register_1 = require("../../Controllers/Auth/Register");
async function RegisterRoutes(fastify) {
    fastify.post('/register', {
        schema: {
            description: 'Registrar novo usuário',
            tags: ['Auth'],
            body: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string' }
                    }
                }
            }
        }
    }, Register_1.Register);
}
