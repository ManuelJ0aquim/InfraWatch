export interface StatusSample {
    timeISO: string;
    up: boolean;
}
export declare function buildIncidentsFromSamples(serviceId: string, samples: StatusSample[]): Promise<number>;
//# sourceMappingURL=ingestStatus.job.d.ts.map