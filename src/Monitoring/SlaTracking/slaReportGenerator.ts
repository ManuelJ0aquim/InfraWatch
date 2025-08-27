import PDFDocument from "pdfkit";

export class SlaReportGenerator {
  static async generatePDF(serviceName: string, sla: any, start: Date, end: Date): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on("error", reject);

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
    });
  }
}
