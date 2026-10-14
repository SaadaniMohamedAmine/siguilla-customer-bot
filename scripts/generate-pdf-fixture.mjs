// Génère tests/fixtures/atelier-shipping.pdf (2 pages) depuis content/demo/atelier-lune/shipping.md,
// pour le test e2e journey.spec.ts (upload réel d'un PDF dans le wizard).
import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

const md = fs.readFileSync(path.join(process.cwd(), "content/demo/atelier-lune/shipping.md"), "utf8");
const doc = new PDFDocument({ size: "A4", margin: 60 });
const outPath = path.join(process.cwd(), "tests/fixtures/atelier-shipping.pdf");
doc.pipe(fs.createWriteStream(outPath));

doc.fontSize(20).text("Atelier Lune — Shipping Policy", { align: "left" });
doc.moveDown();
doc.fontSize(11);
for (const line of md.split("\n")) {
  if (line.startsWith("# ")) continue;
  if (line.startsWith("## ")) {
    doc.moveDown(0.5).fontSize(14).text(line.slice(3)).fontSize(11);
  } else if (line.trim()) {
    doc.text(line.replace(/\*\*/g, ""));
  }
}
doc.addPage();
doc.fontSize(14).text("Page 2 — Switzerland shipping detail", { align: "left" });
doc.moveDown();
doc
  .fontSize(11)
  .text(
    "Switzerland — 3-5 business days. Duties and VAT are calculated and collected at checkout, so there's nothing to pay on delivery.",
  );

doc.end();
console.log(`[fixture] wrote ${outPath}`);
