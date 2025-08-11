import { queryApi } from '../../influxdb';

export async function getServiceMetrics(serviceId: string) {
  const query = `
    from(bucket: "${process.env.INFLUX_BUCKET}")
      |> range(start: -1h)
      |> filter(fn: (r) => r._measurement == "service_status" and r.serviceId == "${serviceId}")
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"])
  `;

  const rows: any[] = [];

  await queryApi.queryRows(query, {
    next(row: any, tableMeta: any) {
      rows.push(tableMeta.toObject(row));
    },
    error(error: any) {
      throw error;
    },
    complete() {}
  });

  return rows;
}
