export type UUID = string;
export type ISODate = string;

export enum WindowStatus { OK = "OK", AT_RISK = "AT_RISK", BREACHED = "BREACHED" }

export interface SlaPolicy {
  id: UUID;
  serviceId?: UUID | null;
  systemId?: UUID | null;
  targetPct: number;
  period: "MONTH";
  timezone: string;
  activeFrom: ISODate;
  activeTo?: ISODate | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface MaintenanceWindow {
  id: UUID;
  serviceId?: UUID | null;
  systemId?: UUID | null;
  startsAt: ISODate;
  endsAt: ISODate;
  reason?: string | null;
  recurrenceRule?: string | null;
}

export interface Incident {
  id: UUID;
  serviceId: UUID;
  startedAt: ISODate;
  endedAt?: ISODate | null;
  isPlanned: boolean;
  source?: string | null;
  createdAt: ISODate;
}

export interface SlaWindow {
  id: UUID;
  serviceId?: UUID | null;
  systemId?: UUID | null;
  periodStart: ISODate;
  periodEnd: ISODate;
  availabilityPct: number;
  errorBudgetAllowedMs: number;
  errorBudgetUsedMs: number;
  status: WindowStatus;
  computedAt: ISODate;
  needsRecompute?: boolean;
}

export interface Violation {
  id: UUID;
  policyId: UUID;
  windowId: UUID;
  expectedPct: number;
  observedPct: number;
  reason?: string | null;
  createdAt: ISODate;
}

export type CompositionRule = "ALL" | "K_OF_N";
export interface System { id: UUID; name: string; compositionRule: CompositionRule; kRequired?: number | null; }
export interface SystemMember { systemId: UUID; serviceId: UUID; isCritical: boolean; }
