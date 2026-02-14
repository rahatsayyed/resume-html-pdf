import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { chromium } from "playwright";

const folderArg = process.argv[2];
const baseDir = folderArg
  ? path.resolve(process.cwd(), folderArg)
  : process.cwd();

if (folderArg && !fs.existsSync(baseDir)) {
  console.error(`Error: Directory '${baseDir}' does not exist.`);
  process.exit(1);
}

const resumePath = path.join(baseDir, "resume.json");
const htmlPath = path.join(baseDir, "resume.html");
const pdfPath = path.join(baseDir, "resume.pdf");

if (!fs.existsSync(resumePath)) {
  console.error(`Error: '${resumePath}' not found.`);
  process.exit(1);
}

const resume = JSON.parse(fs.readFileSync(resumePath, "utf8"));

// Register partials (header and content components)
Handlebars.registerPartial(
  "header",
  fs.readFileSync(path.join(process.cwd(), "components/header.html"), "utf8"),
);
Handlebars.registerPartial(
  "content",
  fs.readFileSync(path.join(process.cwd(), "components/content.html"), "utf8"),
);

// Load template
const templateHtml = fs.readFileSync(
  path.join(process.cwd(), "resume.template.html"),
  "utf8",
);
const template = Handlebars.compile(templateHtml);

// Render
const html = template(resume);

// Save
fs.writeFileSync(htmlPath, html);
console.log(`✅ ${htmlPath} generated`);

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(`file://${htmlPath}`, {
  waitUntil: "load",
});

await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
});

await browser.close();
console.log(`✅ ${pdfPath} generated`);
