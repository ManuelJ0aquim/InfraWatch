"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Login = Login;
const bcrypt_1 = __importDefault(require("bcrypt"));
async function Login(request, reply) {
    const { email, password } = request.body;
    const user = await request.server.prisma.user.findUnique({ where: { email } });
    if (!user) {
        return reply.code(400).send({ message: 'Invalid credentials' });
    }
    const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        return reply.code(400).send({ message: 'Invalid credentials' });
    }
    const token = request.server.jwt.sign({ id: user.id, email: user.email, role: user.role });
    return { token };
}
