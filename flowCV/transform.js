const fs = require("fs");
const path = require("path");

// Read the original flowcv.json
const rawData = fs.readFileSync(path.join(__dirname, "flowcv.json"), "utf8");
const resumeData = JSON.parse(rawData);
const data = resumeData.data.resumes[0];

// Helper to strip HTML tags and extract list items
function parseDescription(html) {
  if (!html) return [];

  // Extract content from <li> tags
  const listItems = [];
  const liRegex = /<li[^>]*>(.*?)<\/li>/gs;
  let match;

  while ((match = liRegex.exec(html)) !== null) {
    // Remove internal HTML tags like <p>, <strong>, etc.
    let text = match[1].replace(/<[^>]+>/g, "").trim();
    // Decode HTML entities basic ones
    text = text.replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");
    if (text) listItems.push(text);
  }

  if (listItems.length > 0) return listItems;

  // Fallback: if no <li>, split by <p> or just strip tags
  return [html.replace(/<[^>]+>/g, "").trim()].filter(Boolean);
}

// Helper to extract issuer and year from certification description
// e.g. "Aiken Development Program": infoHtml: "<p>... by Emurgo Academy</p>"
function parseCertification(entry) {
  let name = entry.certificate || entry.title || ""; // New format uses 'certificate'
  // Use infoHtml for description/issuer extraction
  let descriptionHtml = entry.infoHtml || entry.description || "";
  let descriptionText = descriptionHtml.replace(/<[^>]+>/g, "").trim();

  let issuer = null;
  let year = entry.startDateNew || entry.endDateNew || null;

  // Try to extract issuer from "by ..." or "at ..." pattern
  const byMatch = descriptionText.match(/\b(by|at)\s+([^,.-]+)/i);
  if (byMatch) {
    issuer = byMatch[2].trim();
    // In the new format, 'name' is just the certificate name, so we don't need to strip issuer from it
    // unless the name itself actually contains it.
    // Let's check if name contains the issuer pattern too, just in case.
    const nameByMatch = name.match(
      new RegExp(`\\b(by|at)\\s+${escapeRegExp(issuer)}`, "i"),
    );
    if (nameByMatch) {
      name = name.replace(nameByMatch[0], "").trim();
    }
  }

  // Extract year from description if not present in fields (e.g. "(2024)")
  if (!year) {
    const yearMatch = descriptionText.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) year = yearMatch[0];
  }

  return {
    name: name,
    issuer: issuer,
    year: year,
    credentialUrl: entry.certificateLink || entry.credentialUrl || null,
  };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Main Map
const newResume = {
  name: data.personalDetails.fullName,
  jobTitle: data.personalDetails.jobTitle || null,
  email: data.personalDetails.displayEmail,
  phone: data.personalDetails.phone,
  website: {
    url: data.personalDetails.websiteLink,
    label: data.personalDetails.website,
  },
  social: {
    linkedin: {
      url: data.personalDetails.social.linkedIn.link,
      label: data.personalDetails.social.linkedIn.display,
    },
    github: {
      url: data.personalDetails.social.github.link,
      label: data.personalDetails.social.github.display,
    },
  },
  summary:
    data.content.profile?.entries?.[0]?.text?.replace(/<[^>]+>/g, "").trim() ||
    "",

  experience: (data.content.work?.entries || [])
    .filter((e) => !e.isHidden && e.employer) // Filter out hidden projects and empty employers
    .map((e) => ({
      title: e.jobTitle,
      company: e.employer,
      companyUrl: e.employerLink || null,
      location: e.location || null,
      start: e.startDateNew || null,
      end: e.endDateNew || null,
      description: parseDescription(e.description),
    })),

  projects: (data.content.project?.entries || [])
    .filter((e) => !e.isHidden)
    .map((e) => ({
      title: e.projectTitle,
      link: e.projectTitleLink || null,
      start: e.startDateNew || null,
      end: e.endDateNew || null,
      description: parseDescription(e.description),
    })),

  education: (data.content.education?.entries || [])
    .filter((e) => !e.isHidden)
    .map((e) => ({
      degree: e.degree,
      school: e.school,
      location: e.location || null,
      year: e.endDateNew || null,
    })),

  skills: (data.content.skill?.entries || [])
    .filter((e) => !e.isHidden)
    .map((e) => e.skill),

  certificates: (data.content.certificate?.entries || [])
    .filter((e) => !e.isHidden)
    .map(parseCertification),
};

// Process hidden "Independent and Academic Projects" - REMOVED as per user request to ignore isHidden: true
// const hiddenProjectsEntry = (data.content.work?.entries || []).find(
//   (e) => e.isHidden === true && e.jobTitle.includes("Project"),
// );
// if (hiddenProjectsEntry) {
//   newResume.projects = parseProjects(hiddenProjectsEntry.description);
// }
// Write to resume.json in the parent directory
fs.writeFileSync(
  path.join(__dirname, "../resume.json"),
  JSON.stringify(newResume, null, 2),
);
console.log("✅ resume.json generated with clean structure.");
