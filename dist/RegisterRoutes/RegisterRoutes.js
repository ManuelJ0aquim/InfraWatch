"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterAllRoutes = RegisterAllRoutes;
const jwt_1 = __importDefault(require("../plugins/jwt"));
const prisma_js_1 = __importDefault(require("../plugins/prisma.js"));
const servicesRoutes_1 = require("../routes/APIs/servicesRoutes");
const notificationRoutes_1 = require("../routes/APIs/notificationRoutes");
const serviceMetricsRoutes_1 = require("../routes/APIs/serviceMetricsRoutes");
const alertContactRoutes_1 = require("../routes/APIs/alertContactRoutes");
const notificationPolicy_1 = require("../routes/APIs/notificationPolicy");
const IncidentsRoutes_1 = require("../routes/APIs/IncidentsRoutes");
const slaRoutes_1 = require("../routes/APIs/slaRoutes");
const proxyReceiverRoutes_1 = require("../routes/APIs/proxyReceiverRoutes");
async function RegisterAllRoutes(app) {
    app.register(prisma_js_1.default);
    app.register(jwt_1.default);
    app.register(proxyReceiverRoutes_1.proxyReceiverRoutes);
    app.register(slaRoutes_1.slaRoutes, { prefix: "/api" });
    app.register(servicesRoutes_1.servicesRoutes);
    app.register(alertContactRoutes_1.alertContactRoutes);
    app.register(notificationRoutes_1.notificationRoutes);
    app.register(serviceMetricsRoutes_1.serviceMetricsRoutes);
    app.register(notificationPolicy_1.notificationPolicyRoutes);
    app.register(IncidentsRoutes_1.incidentRoutes, { prefix: '/api/incidents' });
}
