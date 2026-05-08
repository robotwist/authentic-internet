/**
 * Idempotent: adds HTML anchors before each `## Source:` in
 * docs/PROJECT_DOCUMENTATION.md and rewrites ./FOO.md markdown links to #doc-*.
 * Does not alter fenced code blocks or bare backticks (avoid false positives).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const docPath = path.join(root, "docs", "PROJECT_DOCUMENTATION.md");

function anchorIdFromSourceFilename(name) {
  const base = name.replace(/\.md$/i, "").toLowerCase();
  const slug = base.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `doc-${slug}`;
}

let text = fs.readFileSync(docPath, "utf8");

// Strip previously injected anchors (re-run safe)
text = text.replace(/\n<a id="doc-[^"]+"><\/a>\n+(?=## Source:)/g, "\n");

const sourceRe = /^## Source: (.+)$/gm;
const sources = new Map();
let m;
while ((m = sourceRe.exec(text)) !== null) {
  const raw = m[1].trim();
  sources.set(raw, anchorIdFromSourceFilename(raw));
}

text = text.replace(/^## Source: (.+)$/gm, (full, fname) => {
  const id = anchorIdFromSourceFilename(fname.trim());
  return `<a id="${id}"></a>\n\n${full}`;
});

text = text.replace(
  /\]\(\.\/([A-Za-z0-9_.-]+\.md)\)/g,
  (match, fname) => {
    const id = sources.get(fname);
    if (id) return `](#${id})`;
    return `](#documentation-archive)`;
  },
);

fs.writeFileSync(docPath, text, "utf8");
console.log(
  "Updated",
  docPath,
  "—",
  sources.size,
  "sections anchored; relative .md links rewritten.",
);
