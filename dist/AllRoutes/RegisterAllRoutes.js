"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterAllRoutes = RegisterAllRoutes;
const jwt_1 = __importDefault(require("../plugins/jwt"));
const prisma_js_1 = __importDefault(require("../plugins/prisma.js"));
const loginRoutes_js_1 = require("../routes/Auth/loginRoutes.js");
const servicesRoutes_1 = require("../routes/APIs/servicesRoutes");
const RegisterRoutes_js_1 = require("../routes/Auth/RegisterRoutes.js");
const VerifyOTPRoutes_js_1 = require("../routes/Auth/VerifyOTPRoutes.js");
const notificationRoutes_1 = require("../routes/APIs/notificationRoutes");
const serviceMetricsRoutes_1 = require("../routes/APIs/serviceMetricsRoutes");
const ResetPasswordRoutes_js_1 = require("../routes/Auth/ResetPasswordRoutes.js");
const SolicitarResetPasswordRoutes_js_1 = require("../routes/Auth/SolicitarResetPasswordRoutes.js");
async function RegisterAllRoutes(app) {
    app.register(prisma_js_1.default);
    app.register(jwt_1.default);
    app.register(servicesRoutes_1.servicesRoutes);
    app.register(notificationRoutes_1.notificationRoutes);
    app.register(serviceMetricsRoutes_1.serviceMetricsRoutes);
    app.register(loginRoutes_js_1.LoginRoutes, { prefix: "/auth" });
    app.register(RegisterRoutes_js_1.RegisterRoutes, { prefix: "/auth" });
    app.register(VerifyOTPRoutes_js_1.VerifyOTProutes, { prefix: "/auth" });
    app.register(ResetPasswordRoutes_js_1.resetarSenhaRoutes, { prefix: "/auth" });
    app.register(SolicitarResetPasswordRoutes_js_1.solicitarResetSenhaRoutes, { prefix: "/auth" });
}
