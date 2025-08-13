import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';

export async function Register(request: FastifyRequest, reply: FastifyReply)
{
  const { name, email, password } = request.body as { name: string; email: string; password: string };

  const existingUser = await (request.server as any).prisma.user.findUnique({ where: { email } });
  if (existingUser)
  {
    return reply.code(400).send({ message: 'Email already in use' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await (request.server as any).prisma.user.create(
  {
    data: { name, email, password: hashedPassword },
  });
  return { id: user.id, email: user.email };
}
