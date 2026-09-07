import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  isAllowedAvatarAssignment,
  resolveSafeAvatarFilePath,
} from "../../server/utils/safeAvatarPath.js";

test("resolves a real avatar filename inside the avatars directory", () => {
  const cwd = "/workspace";
  const resolved = resolveSafeAvatarFilePath(
    "/uploads/avatars/avatar-123.png",
    cwd,
  );
  assert.equal(
    resolved,
    path.resolve(cwd, "public/uploads/avatars/avatar-123.png"),
  );
});

test("rejects path traversal that would escape the avatars directory", () => {
  const cwd = "/workspace";
  const payloads = [
    "/uploads/avatars/../../../server/package.json",
    "/uploads/avatars/../../../../etc/passwd",
    "/uploads/avatars/../artifact.png",
    "/uploads/avatars/..\\..\\server\\package.json",
    "/uploads/avatars/avatar-123.png/../../../server/package.json",
    "/uploads/avatars/",
    "/uploads/avatars/../../workspace/.env",
  ];

  for (const avatar of payloads) {
    assert.equal(
      resolveSafeAvatarFilePath(avatar, cwd),
      null,
      `should reject ${avatar}`,
    );
  }
});

test("naive path.join would have escaped the avatars directory", () => {
  const cwd = "/workspace";
  const malicious = "/uploads/avatars/../../../server/package.json";
  const naive = path.join(cwd, "public", malicious);
  assert.equal(naive, path.join("/workspace/server/package.json"));
  assert.equal(resolveSafeAvatarFilePath(malicious, cwd), null);
});

test("only unlinks files that actually sit in the avatars directory", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "avatar-unlink-"));
  const avatarsDir = path.join(cwd, "public", "uploads", "avatars");
  const secretsDir = path.join(cwd, "server");
  fs.mkdirSync(avatarsDir, { recursive: true });
  fs.mkdirSync(secretsDir, { recursive: true });

  const legitFile = path.join(avatarsDir, "avatar-old.png");
  const secretFile = path.join(secretsDir, "package.json");
  fs.writeFileSync(legitFile, "old-avatar");
  fs.writeFileSync(secretFile, "do-not-delete");

  try {
    const safePath = resolveSafeAvatarFilePath(
      "/uploads/avatars/avatar-old.png",
      cwd,
    );
    assert.equal(safePath, legitFile);
    fs.unlinkSync(safePath);
    assert.equal(fs.existsSync(legitFile), false);

    const traversalPath = resolveSafeAvatarFilePath(
      "/uploads/avatars/../../../server/package.json",
      cwd,
    );
    assert.equal(traversalPath, null);
    assert.equal(fs.existsSync(secretFile), true);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("PUT /:id avatar assignment allows remote and local upload URLs only", () => {
  assert.equal(
    isAllowedAvatarAssignment(
      "https://api.dicebear.com/7.x/pixel-art/svg?seed=unknown",
    ),
    true,
  );
  assert.equal(
    isAllowedAvatarAssignment("/uploads/avatars/avatar-123.png"),
    true,
  );
  assert.equal(
    isAllowedAvatarAssignment("/uploads/avatars/../../../server/package.json"),
    false,
  );
  assert.equal(isAllowedAvatarAssignment("/etc/passwd"), false);
  assert.equal(isAllowedAvatarAssignment("javascript:alert(1)"), false);
  assert.equal(isAllowedAvatarAssignment(""), false);
});
