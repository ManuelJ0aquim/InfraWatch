import fs from "fs";
import PDFDocument from "pdfkit";
import { SlaResult } from "./slaCalculator";

export class SlaReportGenerator
{
  static async generatePDF(serviceName: string, sla: SlaResult, start: Date, end: Date, filePath: string)
  {
    return new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      doc.fontSize(20).text(`Relatório de SLA - ${serviceName}`, { align: "center" });
      doc.moveDown();

      doc.fontSize(12).text(`Período: ${start.toISOString()} até ${end.toISOString()}`);
      doc.moveDown();

      doc.fontSize(14).text("Resumo do SLA:");
      doc.fontSize(12).list([
        `Total de checks: ${sla.totalChecks}`,
        `Checks UP: ${sla.upChecks}`,
        `Checks DOWN: ${sla.downChecks}`,
        `Uptime: ${sla.uptimePercentage.toFixed(2)}%`,
      ]);
      doc.moveDown();

      doc.fontSize(10).fillColor("gray").text("Gerado automaticamente pelo sistema de monitoramento.");

      doc.end();

      stream.on("finish", () => resolve());
      stream.on("error", (err) => reject(err));
    });
  }
}
