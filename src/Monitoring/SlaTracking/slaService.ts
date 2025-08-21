import { SlaCalculator, SlaResult } from "./slaCalculator";

export class SlaService
{
  private static parsePeriod(period: string): { start: Date; end: Date }
  {
    const now = new Date();
    let start: Date;

    if (period.endsWith("m"))
    {
      const minutes = parseInt(period.slice(0, -1));
      start = new Date(now.getTime() - minutes * 60 * 1000);
    }
    else if (period.endsWith("h"))
    {
      const hours = parseInt(period.slice(0, -1));
      start = new Date(now.getTime() - hours * 60 * 60 * 1000);
    }
    else if (period.endsWith("d"))
    {
      const days = parseInt(period.slice(0, -1));
      start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }
    else if (period.endsWith("mo"))
    {
      const months = parseInt(period.slice(0, -2));
      start = new Date(now);
      start.setMonth(start.getMonth() - months);
    }
    else
    {
      throw new Error("Período inválido. Use m, h, d ou mo.");
    }
    return { start, end: now };
  }

  static async getSlaReport(serviceId: string, start: Date, end: Date): Promise<SlaResult>
  {
    return await SlaCalculator.calculate(serviceId, start, end);
  }

  static async getSlaReportByPeriod(serviceId: string, period: string): Promise<SlaResult>
  {
    const { start, end } = this.parsePeriod(period);
    return await this.getSlaReport(serviceId, start, end);
  }
}
