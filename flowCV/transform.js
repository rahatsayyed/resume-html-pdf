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

// Helper for separate projects (Parsing the specific HTML block for "Independent and Academic Projects")
function parseProjects(html) {
  // The structure is like: <p><em>Title – </em></p><ul><li>...</li></ul>
  // We need to split by <p><em> or similar markers
  // This is specific to the user's data structure

  const projects = [];

  // Regex to find titles in <p><em>...</em></p> or variations
  // and then the following <ul>...</ul> content

  // Split by the title indicators
  const sections = html.split(/<p>\s*<em>/);

  sections.forEach((section) => {
    if (!section.trim()) return;

    // Extract title (up to </em> or –)
    let titleEnd = section.indexOf("</em>");
    if (titleEnd === -1) titleEnd = section.indexOf("<"); // fallback

    let title = section
      .substring(0, titleEnd)
      .replace(/–|&nbsp;/g, "")
      .trim();

    // Extract the list part
    const listStart = section.indexOf("<ul>");
    if (listStart !== -1) {
      const listContent = section.substring(listStart);
      const description = parseDescription(listContent);

      if (title && description.length > 0) {
        projects.push({
          title: title,
          link: null,
          start: null,
          end: null,
          description: description,
        });
      }
    }
  });

  return projects;
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

  projects: [], // Will fill from the hidden entry

  education: (data.content.education?.entries || []).map((e) => ({
    degree: e.degree,
    school: e.school,
    location: e.location || null,
    year: e.endDateNew || null,
  })),

  skills: (data.content.skill?.entries || []).map((e) => e.skill),

  certificates: (data.content.certificate?.entries || []).map(
    parseCertification,
  ),
};

// Process hidden "Independent and Academic Projects"
const hiddenProjectsEntry = (data.content.work?.entries || []).find(
  (e) => e.isHidden === true && e.jobTitle.includes("Project"),
);
if (hiddenProjectsEntry) {
  newResume.projects = parseProjects(hiddenProjectsEntry.description);
}
// Write to resume.json in the parent directory
fs.writeFileSync(
  path.join(__dirname, "../resume.json"),
  JSON.stringify(newResume, null, 2),
);
console.log("✅ resume.json generated with clean structure.");
