import { SlaWindow } from "../domain/types";
export declare function upsertWindow(win: Omit<SlaWindow, "id">): Promise<SlaWindow>;
export declare function getWindow(serviceId: string, periodStart: string, periodEnd: string): Promise<SlaWindow | null>;
export declare function listWindows(serviceId: string, fromISO: string, toISO: string): Promise<SlaWindow[]>;
//# sourceMappingURL=windowRepo.d.ts.map