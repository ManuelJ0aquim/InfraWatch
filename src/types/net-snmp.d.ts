declare module "net-snmp" {
  export interface SessionOptions {
    port?: number;
    retries?: number;
    timeout?: number;
    transport?: string;
    trapPort?: number;
    version?: number;
    backwardsGetNexts?: boolean;
    idBitsSize?: number;
  }

  export interface VarBind {
    oid: string;
    type: number;
    value: any;
  }

  export function createSession(
    target: string,
    community: string,
    options?: SessionOptions
  ): any;

  export function isVarbindError(vb: VarBind): boolean;
}
