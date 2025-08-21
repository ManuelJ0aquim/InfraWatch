"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetarSenha = resetarSenha;
const bcrypt_1 = __importDefault(require("bcrypt"));
async function resetarSenha(req, reply) {
    const { user, token, novaSenha, confirmnovaSenha } = req.body;
    const isEmail = (str) => /\S+@\S+\.\S+/.test(str);
    const usuario = await req.server.prisma.user.findFirst({
        where: { email: user }
    });
    if (!usuario || usuario.passwordResetToken !== token) {
        return reply.status(401).send({ error: "Token inválido ou usuário não encontrado." });
    }
    if (usuario.passwordResetExpires && new Date(usuario.passwordResetExpires) < new Date()) {
        return reply.status(403).send({ error: "Token expirado." });
    }
    if (novaSenha !== confirmnovaSenha) {
        return reply.status(400).send({ error: "Palavras-passe não coincidem." });
    }
    const hashedPassword = await bcrypt_1.default.hash(novaSenha, 10);
    await req.server.prisma.user.update({
        where: { id: usuario.id },
        data: {
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null,
        },
    });
    return reply.send({ message: "Senha redefinida com sucesso." });
}
