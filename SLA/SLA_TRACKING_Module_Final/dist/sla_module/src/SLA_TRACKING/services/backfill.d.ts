import { SlaPolicy } from "../domain/types";
export declare function markWindowForRecompute(serviceId: string, fromISO: string, toISO: string): Promise<void>;
export declare function recomputeWindow(serviceId: string, policy: SlaPolicy, fromISO: string, toISO: string): Promise<import("../domain/types").SlaWindow>;
//# sourceMappingURL=backfill.d.ts.map