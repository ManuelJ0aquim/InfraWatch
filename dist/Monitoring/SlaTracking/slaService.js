"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlaService = void 0;
const slaCalculator_1 = require("./slaCalculator");
function subtractComposite(now, parts) {
    let t = new Date(now);
    for (const { value, unit } of parts) {
        if (value <= 0)
            continue;
        switch (unit) {
            case "y": {
                const d = new Date(t);
                d.setFullYear(d.getFullYear() - value);
                t = d;
                break;
            }
            case "mo": {
                const d = new Date(t);
                d.setMonth(d.getMonth() - value);
                t = d;
                break;
            }
            case "w":
                t = new Date(t.getTime() - value * 604800000);
                break;
            case "d":
                t = new Date(t.getTime() - value * 86400000);
                break;
            case "h":
                t = new Date(t.getTime() - value * 3600000);
                break;
            case "m":
                t = new Date(t.getTime() - value * 60000);
                break;
        }
    }
    return t;
}
function parseCompositePeriodString(period) {
    if (typeof period !== "string" || !period.trim())
        throw new Error("Período inválido: vazio.");
    const p = period.trim().toLowerCase();
    const re = /(\d+)\s*(mo|y|w|d|h|m)\b/gi;
    const parts = [];
    let match;
    while ((match = re.exec(p)) !== null) {
        const value = parseInt(match[1], 10);
        const unit = match[2];
        if (!Number.isFinite(value) || value <= 0)
            throw new Error("Período inválido: valores devem ser inteiros positivos.");
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
class SlaService {
    /**
     * Recebe um período e devolve { start, end }.
     * Formatos aceites:
     *  - Composite: "15m", "6h", "7d", "2w3d", "1h30m", "1y2mo", etc.
     *  - Prefixados legacy: "last-7d", "last-24h", etc. (equivalente a remover "last-").
     *  - Mês específico: YYYY-MM (ex: 2025-01) => mês civil inteiro.
     *  - Dia específico: YYYY-MM-DD => dia civil inteiro.
     */
    static parsePeriod(period) {
        if (typeof period !== 'string')
            throw new Error('Período inválido.');
        let p = period.trim();
        if (!p)
            throw new Error('Período vazio.');
        // legacy prefix "last-"
        if (p.startsWith('last-'))
            p = p.substring(5);
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
        if (start >= now)
            throw new Error('Período inválido: início no futuro.');
        return { start, end: now };
    }
    static async getSlaReport(serviceId, start, end) {
        const now = new Date();
        const safeEnd = end > now ? now : end;
        if (start >= safeEnd)
            throw new Error("Intervalo inválido: 'start' deve ser anterior a 'end'.");
        return await slaCalculator_1.SlaCalculator.calculate(serviceId, start, safeEnd);
    }
    static async getSlaReportByPeriod(serviceId, period) {
        const { start, end } = this.parsePeriod(period);
        return await this.getSlaReport(serviceId, start, end);
    }
}
exports.SlaService = SlaService;
