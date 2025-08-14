import { FastifyInstance } from "fastify";
import { getSlaStatus } from "./controllers/slaStatus.controller";
import { listIncidents, createIncidentHandler } from "./controllers/incidents.controller";
import { listMaintenances, createMaintenanceHandler } from "./controllers/maintenance.controller";
import { listPoliciesHandler, createPolicyHandler } from "./controllers/policies.controller";
import { listViolationsHandler } from "./controllers/violations.controller";

export default async function slaRoutes(app: FastifyInstance) {
  app.get("/api/services/:id/sla/status", getSlaStatus);
  app.get("/api/services/:id/sla/incidents", listIncidents);
  app.post("/api/services/:id/sla/incidents", createIncidentHandler);
  app.get("/api/services/:id/maintenance-windows", listMaintenances);
  app.post("/api/services/:id/maintenance-windows", createMaintenanceHandler);
  app.get("/api/sla/policies", listPoliciesHandler);
  app.post("/api/sla/policies", createPolicyHandler);
  app.get("/api/sla/policies/:policyId/violations", listViolationsHandler);
}
