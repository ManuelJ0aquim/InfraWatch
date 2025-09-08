import { SlaCalculator, SlaResult } from "./slaCalculator";

type Unit = "m" | "h" | "d" | "w" | "mo" | "y";

function subtractComposite(now: Date, parts: Array<{ value: number; unit: Unit }>): Date {
  let t = new Date(now);
  for (const { value, unit } of parts) {
    if (value <= 0) continue;
    switch (unit) {
      case "y":  { const d = new Date(t); d.setFullYear(d.getFullYear() - value); t = d; break; }
      case "mo": { const d = new Date(t); d.setMonth(d.getMonth() - value); t = d; break; }
      case "w":  t = new Date(t.getTime() - value * 604_800_000); break;
      case "d":  t = new Date(t.getTime() - value * 86_400_000);  break;
      case "h":  t = new Date(t.getTime() - value * 3_600_000);   break;
      case "m":  t = new Date(t.getTime() - value * 60_000);      break;
    }
  }
  return t;
}

function parseCompositePeriodString(period: string): Array<{ value: number; unit: Unit }> {
  if (typeof period !== "string" || !period.trim()) throw new Error("Período inválido: vazio.");
  const p = period.trim().toLowerCase();

  const re = /(\d+)\s*(mo|y|w|d|h|m)\b/gi;
  const parts: Array<{ value: number; unit: Unit }> = [];

  let match: RegExpExecArray | null;
  while ((match = re.exec(p)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2] as Unit;
    if (!Number.isFinite(value) || value <= 0) throw new Error("Período inválido: valores devem ser inteiros positivos.");
    parts.push({ value, unit });
  }

  if (parts.length === 0) {
    throw new Error("Período inválido. Exemplos: 15m, 6h, 7d, 2mo, 1h30m, 2w3d, 1y2mo.");
  }

  const cleaned = p.replace(re, "").trim();
  if (cleaned.length > 0) {
    throw new Error(`Período inválido: token não reconhecido perto de "${cleaned}".`);
  }

  return parts;
}

export class SlaService {
  /**
   * Recebe um período e devolve { start, end }.
   * Formatos aceites:
   *  - Composite: "15m", "6h", "7d", "2w3d", "1h30m", "1y2mo", etc.
   *  - Prefixados legacy: "last-7d", "last-24h", etc. (equivalente a remover "last-").
   *  - Mês específico: YYYY-MM (ex: 2025-01) => mês civil inteiro.
   *  - Dia específico: YYYY-MM-DD => dia civil inteiro.
   */
  static parsePeriod(period: string): { start: Date; end: Date } {
    if (typeof period !== 'string') throw new Error('Período inválido.');
    let p = period.trim();
    if (!p) throw new Error('Período vazio.');

    // legacy prefix "last-"
    if (p.startsWith('last-')) p = p.substring(5);

    // YYYY-MM (mês)
    if (/^\d{4}-\d{2}$/.test(p)) {
      const [y, m] = p.split('-').map(Number);
      const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
      return { start, end };
    }
    // YYYY-MM-DD (dia)
    if (/^\d{4}-\d{2}-\d{2}$/.test(p)) {
      const [y, m, d] = p.split('-').map(Number);
      const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
      const end = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0, 0));
      return { start, end };
    }

    // composite relativo
    const parts = parseCompositePeriodString(p);
    const now = new Date();
    const start = subtractComposite(now, parts);
    if (start >= now) throw new Error('Período inválido: início no futuro.');
    return { start, end: now };
  }

  static async getSlaReport(serviceId: string, start: Date, end: Date): Promise<SlaResult> {
    const now = new Date();
    const safeEnd = end > now ? now : end;
    if (start >= safeEnd) throw new Error("Intervalo inválido: 'start' deve ser anterior a 'end'.");
    return await SlaCalculator.calculate(serviceId, start, safeEnd);
  }

  static async getSlaReportByPeriod(serviceId: string, period: string): Promise<SlaResult> {
    const { start, end } = this.parsePeriod(period);
    return await this.getSlaReport(serviceId, start, end);
  }

  /**
   * Gera histórico de uptime agregado por intervalo (dia ou hora).
   */
  static async getSlaHistory(
    serviceId: string,
    start: Date,
    end: Date,
    granularity: "day" | "hour" = "day"
  ): Promise<Array<{ timestamp: string; uptime: number }>> {
    const history: Array<{ timestamp: string; uptime: number }> = [];

    const stepMs = granularity === "day" ? 86_400_000 : 3_600_000;

    for (let t = start.getTime(); t < end.getTime(); t += stepMs) {
      const slotStart = new Date(t);
      const slotEnd = new Date(Math.min(t + stepMs, end.getTime()));

      const slotSla = await SlaCalculator.calculate(serviceId, slotStart, slotEnd);

      history.push({
        timestamp:
          granularity === "day"
            ? slotStart.toISOString().split("T")[0] // yyyy-mm-dd
            : slotStart.toISOString(),
        uptime: Number(slotSla.uptimePercentage?.toFixed(2)),
      });
    }

    return history;
  }
}
