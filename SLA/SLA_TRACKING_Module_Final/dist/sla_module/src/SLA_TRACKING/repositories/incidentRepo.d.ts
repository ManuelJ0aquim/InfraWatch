import { Incident } from "../domain/types";
export declare function listIncidentsForService(serviceId: string, fromISO: string, toISO: string): Promise<Incident[]>;
export declare function createIncident(inc: Omit<Incident, "id" | "createdAt">): Promise<Incident>;
//# sourceMappingURL=incidentRepo.d.ts.map