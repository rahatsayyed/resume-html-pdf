import fs from "fs";
import Handlebars from "handlebars";
import { chromium } from "playwright";
const raw = JSON.parse(fs.readFileSync("resume.json", "utf8"));
const resumeData = raw.data.resumes[0];

/** Remove any entry with isHidden: true from content.*.entries (work, education, skill, etc.) */
function filterHiddenEntries(resume) {
  const out = JSON.parse(JSON.stringify(resume));
  if (!out.content || typeof out.content !== "object") return out;
  for (const key of Object.keys(out.content)) {
    const section = out.content[key];
    if (section?.entries && Array.isArray(section.entries)) {
      section.entries = section.entries.filter((entry) => !entry.isHidden);
    }
  }
  return out;
}

const resume = filterHiddenEntries(resumeData);

// Register partials (header and content components)
Handlebars.registerPartial(
  "header",
  fs.readFileSync("components/header.html", "utf8")
);
Handlebars.registerPartial(
  "content",
  fs.readFileSync("components/content.html", "utf8")
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
