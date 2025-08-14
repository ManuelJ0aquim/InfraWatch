import { MaintenanceWindow } from "../domain/types";
export declare function listMaintenancesForService(serviceId: string, fromISO: string, toISO: string): Promise<MaintenanceWindow[]>;
export declare function createMaintenance(mw: Omit<MaintenanceWindow, "id">): Promise<MaintenanceWindow>;
//# sourceMappingURL=maintenanceRepo.d.ts.map