import { FastifyReply, FastifyRequest } from "fastify";
import { EmailProvider } from "../../Notifications/Email/EmailProvider";

export async function solicitarResetSenha(req: FastifyRequest, reply: FastifyReply) {
  const { user } = req.body as { user: string };

  if (!user)
  {
    return reply.status(400).send({ error: "Campo obrigatório não preenchido" });
  }

  const isEmail = (str: string) => /\S+@\S+\.\S+/.test(str);

  const usuario = await req.server.prisma.user.findFirst(
  {
    where: isEmail(user) ? { email: user } : { name: user },
  });

  if (!usuario)
  {
    return reply.status(404).send({ error: "Usuário não encontrado." });
  }

  const token = Math.floor(1000 + Math.random() * 9000).toString();

  await req.server.prisma.user.update(
  {
    where: { id: usuario.id },
    data:
    {
      passwordResetToken   : token,
      passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  if (usuario.email)
  {
    const emailProvider = new EmailProvider();
    await emailProvider.sendNotification2(
      usuario.email,
      `${token}`
    );
  }

  return reply.send({ message: "Token de redefinição enviado com sucesso." });
}
