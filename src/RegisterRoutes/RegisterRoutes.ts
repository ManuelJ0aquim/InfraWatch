import jwtPlugin from '../plugins/jwt';
import prisma from "../plugins/prisma.js";
import { FastifyInstance } from "fastify";
import { LoginRoutes } from "../routes/Auth/loginRoutes.js";
import { servicesRoutes } from '../routes/APIs/servicesRoutes';
import { RegisterRoutes } from "../routes/Auth/RegisterRoutes.js";
import { VerifyOTProutes } from "../routes/Auth/VerifyOTPRoutes.js";
import { notificationRoutes } from '../routes/APIs/notificationRoutes';
import { serviceMetricsRoutes } from '../routes/APIs/serviceMetricsRoutes';
import { resetarSenhaRoutes } from "../routes/Auth/ResetPasswordRoutes.js";
import { addServiceRoutes } from "../routes/APIs/addServiceRoutes";
import { alertContactRoutes } from '../routes/APIs/alertContactRoutes';
import { solicitarResetSenhaRoutes } from "../routes/Auth/SolicitarResetPasswordRoutes.js";
import { notificationPolicyRoutes } from '../routes/APIs/notificationPolicy';
import { incidentRoutes } from '../routes/APIs/IncidentsRoutes';
import { slaRoutes } from "../routes/APIs/slaRoutes";
import { proxyReceiverRoutes } from "../routes/APIs/proxyReceiverRoutes";

export async function RegisterAllRoutes(app: FastifyInstance)
{    
    app.register(prisma);
    app.register(jwtPlugin);
    app.register(proxyReceiverRoutes);
    app.register(slaRoutes, { prefix: "/api" });
    app.register(servicesRoutes);
    app.register(alertContactRoutes);
    app.register(notificationRoutes);
    app.register(serviceMetricsRoutes);
    app.register(addServiceRoutes);
    app.register(notificationPolicyRoutes);
    app.register(incidentRoutes, { prefix: '/api/incidents' });
    app.register(LoginRoutes, { prefix: "/auth" });
    app.register(RegisterRoutes, { prefix: "/auth" });
    app.register(VerifyOTProutes, { prefix: "/auth" });
    app.register(resetarSenhaRoutes, { prefix: "/auth" });
    app.register(solicitarResetSenhaRoutes, { prefix: "/auth" });
}
