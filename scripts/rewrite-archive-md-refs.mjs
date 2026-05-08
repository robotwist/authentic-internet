/**
 * Rewrites bare `FILE.md` and **FILE.md** references in docs/PROJECT_DOCUMENTATION.md
 * (outside fenced code blocks) into internal markdown links using the same anchor
 * scheme as annotate-doc-archive.mjs. Run after consolidate + annotate.
 *
 * Does not modify fenced ``` blocks. Idempotent for already-linked [**x**](url).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docPath = path.join(__dirname, "..", "docs", "PROJECT_DOCUMENTATION.md");

function anchorIdFromSourceFilename(name) {
  const base = name.replace(/\.md$/i, "").toLowerCase();
  const slug = base.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `doc-${slug}`;
}

/** Older doc titles → nearest archived ## Source: filename */
const ALIAS_TO_SOURCE = {
  "ONBOARDING_SYSTEM_SUMMARY.md": "QUICK_START_CHARACTER_CREATOR.md",
  "NPC_SYSTEM_SUMMARY.md": "NPC_AUDIT.md",
  "COMPLETE_XP_IMPLEMENTATION_GUIDE.md": "XP_SYSTEM_INTEGRATION_COMPLETE.md",
};

/** Keep as literal (semantic “file does not exist” or non-archive) */
const SKIP_FILES = new Set(["validation-rules.md"]);

function buildSourcesSet(text) {
  const sources = new Set();
  const sourceRe = /^## Source: (.+)$/gm;
  let m;
  while ((m = sourceRe.exec(text)) !== null) {
    sources.add(m[1].trim());
  }
  return sources;
}

function resolveHref(fname) {
  if (SKIP_FILES.has(fname)) return null;
  const canonical = ALIAS_TO_SOURCE[fname] ?? fname;
  if (sources.has(canonical)) return `#${anchorIdFromSourceFilename(canonical)}`;
  return "#documentation-archive";
}

let text = fs.readFileSync(docPath, "utf8");
const sources = buildSourcesSet(text);

const lines = text.split("\n");
let inFence = false;
let changed = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith("```")) {
    inFence = !inFence;
    continue;
  }
  if (inFence) continue;

  let s = line;
  const before = s;

  s = s.replace(
    /\/home\/robwistrand\/code\/ga\/projects\/authentic-internet\/([A-Za-z0-9_.-]+\.md)/g,
    (full, fn) => {
      const href = resolveHref(fn);
      if (!href) return full;
      return `[${fn}](${href})`;
    },
  );

  s = s.replace(
    /\(see ([A-Za-z0-9_.\/-]+\.md)\)/g,
    (full, fn) => {
      const href = resolveHref(fn);
      if (!href) return full;
      return `(see [${fn}](${href}))`;
    },
  );

  s = s.replace(
    /(?<!\[)\*\*([A-Za-z0-9_.\/-]+\.md)\*\*(:)?/g,
    (_, fn, colon) => {
      const href = resolveHref(fn);
      if (!href) return `**${fn}**${colon ?? ""}`;
      return `[**${fn}**](${href})${colon ?? ""}`;
    },
  );

  s = s.replace(
    /(?<!\])\`([A-Za-z0-9_.\/-]+\.md)\`/g,
    (_, fn) => {
      const href = resolveHref(fn);
      if (!href) return `\`${fn}\``;
      return `[${fn}](${href})`;
    },
  );

  if (s !== before) {
    lines[i] = s;
    changed++;
  }
}

text = lines.join("\n");
fs.writeFileSync(docPath, text, "utf8");
console.log(
  "rewrite-archive-md-refs:",
  changed,
  "lines updated in",
  docPath,
);
