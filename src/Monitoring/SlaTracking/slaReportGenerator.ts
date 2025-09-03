import PDFDocument from "pdfkit";
import { SlaResult } from "./slaCalculator";

export class SlaReportGenerator {
  static async generatePDF(
    serviceName: string,
    sla: SlaResult,
    start: Date,
    end: Date
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      doc.fontSize(20).text(`Relatório de SLA - ${serviceName}`, { align: "center" });
      doc.moveDown();

      doc.fontSize(12).text(`Período: ${start.toISOString()}  —  ${end.toISOString()} (UTC)`);
      doc.moveDown();

      const uptimeSamples =
        sla.uptimePercentage == null ? "Sem dados" : `${sla.uptimePercentage.toFixed(2)}%`;

      doc.fontSize(12).list([
        `Total de checks: ${sla.totalChecks}`,
        `Checks UP: ${sla.upChecks}`,
        `Checks DOWN: ${sla.downChecks}`,
        `Uptime (por amostras): ${uptimeSamples}`,
      ]);
      doc.moveDown();

      if (typeof sla.uptimePercentageByTime === "number") {
        doc.fontSize(11).text(
          `Uptime (por tempo, excl. "desconhecido"): ${sla.uptimePercentageByTime.toFixed(2)}%`
        );
        doc.moveDown(0.5);
      }

      if (
        typeof sla.upDurationMs === "number" &&
        typeof sla.downDurationMs === "number" &&
        typeof sla.unknownDurationMs === "number"
      ) {
        const fmt = (ms: number) => {
          const s = Math.floor(ms / 1000);
          const h = Math.floor(s / 3600);
          const m = Math.floor((s % 3600) / 60);
          const ss = s % 60;
          return `${h}h ${m}m ${ss}s`;
        };
        doc.fontSize(10).fillColor("gray").text(
          `Duração UP: ${fmt(sla.upDurationMs)}  •  Duração DOWN: ${fmt(
            sla.downDurationMs
          )}  •  Desconhecido: ${fmt(sla.unknownDurationMs)}`
        );
        doc.moveDown();
      }

      doc.fontSize(10).fillColor("gray").text("Gerado automaticamente pelo sistema de monitorização.");
      doc.end();
    });
  }
}
