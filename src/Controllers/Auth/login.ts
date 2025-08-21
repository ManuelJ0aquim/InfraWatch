import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';

export async function Login(request: FastifyRequest, reply: FastifyReply)
{
  const { email, password } = request.body as { email: string; password: string };

  const user = await request.server.prisma.user.findUnique({ where: { email } });
  if (!user)
  {
    return reply.code(400).send({ message: 'Invalid credentials' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid)
  {
    return reply.code(400).send({ message: 'Invalid credentials' });
  }

  const token = request.server.jwt.sign({ id: user.id, email: user.email, role: user.role });
  return { token };
}
