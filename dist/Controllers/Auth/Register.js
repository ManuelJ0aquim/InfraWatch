"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Register = Register;
const bcrypt_1 = __importDefault(require("bcrypt"));
async function Register(request, reply) {
    const { name, email, password } = request.body;
    const existingUser = await request.server.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return reply.code(400).send({ message: 'Email already in use' });
    }
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const user = await request.server.prisma.user.create({
        data: { name, email, password: hashedPassword },
    });
    return { id: user.id, email: user.email };
}
