const fs = require("fs");
const { execSync } = require("child_process");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const expressions = require("docxtemplater/expressions");

const templatePath = "resume-template.docx";
const docxOutput = "resume.docx";
const pdfOutput = "resume.pdf";
const data = JSON.parse(fs.readFileSync("resume.json", "utf8"));

// Load template
const content = fs.readFileSync(templatePath);
const zip = new PizZip(content);
const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
  delimiters: { start: "{{", end: "}}" },
  parser: expressions,
});

// ---- Derived fields for templates ----
// data.skillsLanguagesText = data.skills.languages.join(", ");

// Render
doc.render(data);

// Save DOCX
const buffer = doc.getZip().generate({ type: "nodebuffer" });
fs.writeFileSync(docxOutput, buffer);
console.log("✅ DOCX generated", docxOutput);

// Convert to PDF using LibreOffice
try {
  execSync(`soffice --headless --convert-to pdf "${docxOutput}" --outdir .`, {
    stdio: "inherit",
  });
  console.log("✅ PDF generated:", pdfOutput);
} catch (err) {
  console.error("❌ PDF conversion failed");
  process.exit(1);
}
