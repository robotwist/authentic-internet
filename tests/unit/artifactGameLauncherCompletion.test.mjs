import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const launcherPath = path.resolve(
  __dirname,
  "../../client/src/components/ArtifactGameLauncher.jsx",
);

describe("ArtifactGameLauncher completion / progress auth", () => {
  const source = fs.readFileSync(launcherPath, "utf8");

  it("does not call undefined updateArtifactStats on completion", () => {
    assert.equal(
      /updateArtifactStats\s*\(/.test(source),
      false,
      "updateArtifactStats was never defined and crashed completion",
    );
  });

  it("uses localStorage token for progress load/save, not user.token", () => {
    assert.equal(
      /user\?\.token|user\.token/.test(source),
      false,
      "AuthContext user has no token property; progress calls must use localStorage",
    );
    assert.match(source, /localStorage\.getItem\(\s*["']token["']\s*\)/);
  });
});
