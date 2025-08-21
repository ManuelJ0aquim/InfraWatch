import { FastifyReply, FastifyRequest } from "fastify";

export async function VerifyOTP(req: FastifyRequest, reply: FastifyReply)
{
  const { user, token } = req.body as { user: string; token: string };

  const cleanUser = user.trim().toLowerCase().replace(/[^+\dA-Za-z@.]/g, "");
  const isEmail = /\S+@\S+\.\S+/.test(cleanUser);

  if (!isEmail)
  {
    return reply.status(400).send({ error: "Email inválido." });
  }

  const usuario = await req.server.prisma.user.findFirst(
  {
    where:
    {
      email: cleanUser,
      passwordResetToken: token,
    },
  });
  

  if (!usuario || usuario.passwordResetToken !== token)
  {
    return reply.status(401).send({ error: "OTP inválido" });
  }

  if (usuario.passwordResetExpires && new Date(usuario.passwordResetExpires) < new Date())
  {
    return reply.status(403).send({ error: "Token expirado." });
  }
  return reply.send({ message: "Token válido" });
}
