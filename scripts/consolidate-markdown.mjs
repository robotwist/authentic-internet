/**
 * DESTRUCTIVE: merges root + client-root + server-root *.md into
 * docs/PROJECT_DOCUMENTATION.md, strips emoji, then DELETES those sources.
 * Does not touch .specstory/ or deep client/public asset READMEs.
 * Do not run unless you intend to regenerate the consolidated doc.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function stripEmojis(text) {
  return (
    text
      // Unicode emoji / pictographic blocks
      .replace(/\p{Extended_Pictographic}/gu, "")
      .replace(/\uFE0F/g, "")
      .replace(/\u200D/g, "")
      .replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, "")
      .replace(/[\u2600-\u26FF]/g, "")
      .replace(/[\u2700-\u27BF]/g, "")
      .replace(/[\u231A-\u23FA]/g, "")
      .replace(/[\u2B50-\u2B55]/g, "")
      .replace(/[\u203C\u2049]/g, "")
      .replace(/[\u{1F000}-\u{1F02F}]/gu, "")
      .replace(/[\u{1F0A0}-\u{1F0FF}]/gu, "")
      .replace(/[\u{1F100}-\u{1F64F}]/gu, "")
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, "")
      .replace(/[\u{1FA00}-\u{1FAFF}]/gu, "")
      // ZWJ sequences left as lone ZWJ already stripped; trim trailing spaces on lines
      .replace(/[ \t]+\n/g, "\n")
  );
}

function listRootMd() {
  return fs
    .readdirSync(root)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .map((f) => path.join(root, f))
    .sort();
}

function listClientRootMd() {
  const dir = path.join(root, "client");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.join(dir, f))
    .sort();
}

function listServerRootMd() {
  const dir = path.join(root, "server");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.join(dir, f))
    .sort();
}

const outDir = path.join(root, "docs");
fs.mkdirSync(outDir, { recursive: true });

const sources = [
  ...listRootMd(),
  ...listClientRootMd(),
  ...listServerRootMd(),
];

let body = `# Authentic Internet — consolidated project documentation

Former standalone Markdown files were merged here so there is a single reference in the repo. Each section notes its original path. Emoji were removed during consolidation.

---

`;

for (const abs of sources) {
  const rel = path.relative(root, abs).replace(/\\/g, "/");
  let raw = fs.readFileSync(abs, "utf8");
  raw = stripEmojis(raw);
  body += `## Source: ${rel}\n\n`;
  body += raw.trimEnd();
  body += "\n\n---\n\n";
}

const outPath = path.join(outDir, "PROJECT_DOCUMENTATION.md");
fs.writeFileSync(outPath, body.trimEnd() + "\n", "utf8");
console.log("Wrote", path.relative(root, outPath), `(${sources.length} files merged)`);

for (const abs of sources) {
  fs.unlinkSync(abs);
  console.log("Removed", path.relative(root, abs));
}

console.log(
  "\nNext (recommended): node scripts/annotate-doc-archive.mjs",
  "\nOptional (bare FILE.md in prose): node scripts/rewrite-archive-md-refs.mjs",
);
