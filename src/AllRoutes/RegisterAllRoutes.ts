import prisma from "../plugins/prisma.js";
import jwtPlugin from '../plugins/jwt';
import { FastifyInstance } from "fastify";
import { LoginRoutes } from "../routes/Auth/loginRoutes.js";
import { RegisterRoutes } from "../routes/Auth/RegisterRoutes.js";
import { VerifyOTProutes } from "../routes/Auth/VerifyOTPRoutes.js";
import { resetarSenhaRoutes } from "../routes/Auth/ResetPasswordRoutes.js";
import { solicitarResetSenhaRoutes } from "../routes/Auth/SolicitarResetPasswordRoutes.js";
import { servicesRoutes } from '../routes/APIs/servicesRoutes';
import { notificationRoutes } from '../routes/APIs/notificationRoutes';
import { serviceMetricsRoutes } from '../routes/APIs/serviceMetricsRoutes';

export async function RegisterAllRoutes(app: FastifyInstance)
{    
    app.register(prisma);
    app.register(jwtPlugin);
    app.register(servicesRoutes);
    app.register(serviceMetricsRoutes);
    app.register(notificationRoutes);
    app.register(solicitarResetSenhaRoutes, { prefix: "/auth" });
    app.register(resetarSenhaRoutes, { prefix: "/auth" });
    app.register(LoginRoutes, { prefix: "/auth" });
    app.register(VerifyOTProutes, { prefix: "/auth" });
    app.register(RegisterRoutes, { prefix: "/auth" });
}
