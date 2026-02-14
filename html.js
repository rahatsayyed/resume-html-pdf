import fs from "fs";
import Handlebars from "handlebars";
import { chromium } from "playwright";
const resume = JSON.parse(fs.readFileSync("resume.json", "utf8"));

// Register partials (header and content components)
Handlebars.registerPartial(
  "header",
  fs.readFileSync("components/header.html", "utf8"),
);
Handlebars.registerPartial(
  "content",
  fs.readFileSync("components/content.html", "utf8"),
);

// Load template
const templateHtml = fs.readFileSync("resume.template.html", "utf8");
const template = Handlebars.compile(templateHtml);

// Render
const html = template(resume);

// Save
fs.writeFileSync("resume.html", html);
console.log("✅ resume.html generated");

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(`file://${process.cwd()}/resume.html`, {
  waitUntil: "networkidle",
});

await page.pdf({
  path: "resume.pdf",
  format: "A4",
  printBackground: true,
});

await browser.close();
