import { FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcrypt";

export async function resetarSenha(req: FastifyRequest, reply: FastifyReply)
{
  const { user, token, novaSenha, confirmnovaSenha } = req.body as
  {
    user: string;
    token: string;
    novaSenha: string;
    confirmnovaSenha: string;
  };

  const usuario = await req.server.prisma.user.findFirst(
  {
    where: { email: user }
  });

  if (!usuario || usuario.passwordResetToken !== token)
  {
    return reply.status(401).send({ error: "Token inválido ou usuário não encontrado." });
  }

  if (usuario.passwordResetExpires && new Date(usuario.passwordResetExpires) < new Date())
  {
    return reply.status(403).send({ error: "Token expirado." });
  }

  if (novaSenha !== confirmnovaSenha)
  {
    return reply.status(400).send({ error: "Palavras-passe não coincidem." });
  }

  const hashedPassword = await bcrypt.hash(novaSenha, 10);

  await req.server.prisma.user.update(
  {
    where: { id: usuario.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  return reply.send({ message: "Senha redefinida com sucesso." });
}
