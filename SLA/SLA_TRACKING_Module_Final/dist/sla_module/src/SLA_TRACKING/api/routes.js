"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = slaRoutes;
const slaStatus_controller_1 = require("./controllers/slaStatus.controller");
const incidents_controller_1 = require("./controllers/incidents.controller");
const maintenance_controller_1 = require("./controllers/maintenance.controller");
const policies_controller_1 = require("./controllers/policies.controller");
const violations_controller_1 = require("./controllers/violations.controller");
async function slaRoutes(app) {
    app.get("/api/services/:id/sla/status", slaStatus_controller_1.getSlaStatus);
    app.get("/api/services/:id/sla/incidents", incidents_controller_1.listIncidents);
    app.post("/api/services/:id/sla/incidents", incidents_controller_1.createIncidentHandler);
    app.get("/api/services/:id/maintenance-windows", maintenance_controller_1.listMaintenances);
    app.post("/api/services/:id/maintenance-windows", maintenance_controller_1.createMaintenanceHandler);
    app.get("/api/sla/policies", policies_controller_1.listPoliciesHandler);
    app.post("/api/sla/policies", policies_controller_1.createPolicyHandler);
    app.get("/api/sla/policies/:policyId/violations", violations_controller_1.listViolationsHandler);
}
//# sourceMappingURL=routes.js.map