import { queryApi } from "../../Influxdb/influxdb";

export interface SlaResult {
  totalChecks: number;
  upChecks: number;
  downChecks: number;
  uptimePercentage: number;
}

export class SlaCalculator {
  static async calculate(serviceId: string, start: Date, end: Date): Promise<SlaResult>
  {
    const query = `
      from(bucket: "${process.env.INFLUX_BUCKET}")
        |> range(start: ${start.toISOString()}, stop: ${end.toISOString()})
        |> filter(fn: (r) => r._measurement == "service_status")
        |> filter(fn: (r) => r.serviceId == "${serviceId}")
        |> filter(fn: (r) => r._field == "status")
    `;

    let total = 0;
    let up = 0;
    let down = 0;

    await new Promise<void>((resolve, reject) => {
      queryApi.queryRows(query, {
        next: (row, tableMeta) => {
          const o = tableMeta.toObject(row);
          total++;
          if (o._value === "UP")
            up++;
          else
            down++;
        },
        error: (err) => reject(err),
        complete: () => resolve(),
      });
    });

    const uptime = total > 0 ? (up / total) * 100 : 0;

    return {
      totalChecks: total,
      upChecks: up,
      downChecks: down,
      uptimePercentage: uptime,
    };
  }
}
