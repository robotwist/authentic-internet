import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

const firstMatchingLineIndex = (contents, matcher) =>
  contents
    .split(/\r?\n/)
    .findIndex((line) => matcher(line.trim()));

describe("Netlify API redirects", () => {
  test("netlify.toml routes API requests before the SPA fallback", () => {
    const contents = readFileSync(
      path.join(repoRoot, "client", "netlify.toml"),
      "utf8",
    );

    const apiRedirectIndex = firstMatchingLineIndex(
      contents,
      (line) => line === 'from = "/api/*"',
    );
    const spaFallbackIndex = firstMatchingLineIndex(
      contents,
      (line) => line === 'from = "/*"',
    );

    expect(apiRedirectIndex).toBeGreaterThanOrEqual(0);
    expect(spaFallbackIndex).toBeGreaterThanOrEqual(0);
    expect(apiRedirectIndex).toBeLessThan(spaFallbackIndex);
  });

  test("public _redirects routes API requests before the SPA fallback", () => {
    const contents = readFileSync(
      path.join(repoRoot, "client", "public", "_redirects"),
      "utf8",
    );
    const rules = contents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));

    const apiRedirectIndex = rules.findIndex((line) =>
      line.startsWith("/api/* "),
    );
    const spaFallbackIndex = rules.findIndex((line) =>
      line.startsWith("/* "),
    );

    expect(apiRedirectIndex).toBeGreaterThanOrEqual(0);
    expect(spaFallbackIndex).toBeGreaterThanOrEqual(0);
    expect(apiRedirectIndex).toBeLessThan(spaFallbackIndex);
  });
});
