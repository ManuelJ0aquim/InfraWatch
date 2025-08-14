import { SlaPolicy } from "../domain/types";
export declare function getActivePolicyForService(serviceId: string): Promise<SlaPolicy | null>;
export declare function listPolicies(): Promise<SlaPolicy[]>;
export declare function createPolicy(data: Omit<SlaPolicy, "id" | "createdAt" | "updatedAt">): Promise<SlaPolicy>;
//# sourceMappingURL=policyRepo.d.ts.map