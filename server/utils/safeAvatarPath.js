import path from "path";

export const AVATAR_URL_PREFIX = "/uploads/avatars/";

/**
 * Resolve a stored avatar URL to a file inside public/uploads/avatars.
 * Returns null for remote URLs, malformed values, or path traversal.
 */
export function resolveSafeAvatarFilePath(avatarUrl, cwd = process.cwd()) {
  const filename = getSafeAvatarFilename(avatarUrl);
  if (!filename) {
    return null;
  }

  const avatarsDir = path.resolve(cwd, "public", "uploads", "avatars");
  const resolved = path.resolve(avatarsDir, filename);
  const avatarsPrefix = avatarsDir.endsWith(path.sep)
    ? avatarsDir
    : avatarsDir + path.sep;

  if (resolved !== avatarsDir && !resolved.startsWith(avatarsPrefix)) {
    return null;
  }

  return resolved;
}

/**
 * True when the value is safe to persist as User.avatar:
 * an http(s) URL, or `/uploads/avatars/<basename>` with no traversal.
 */
export function isAllowedAvatarAssignment(avatar) {
  if (typeof avatar !== "string") {
    return false;
  }

  const value = avatar.trim();
  if (!value) {
    return false;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  return getSafeAvatarFilename(value) !== null;
}

function getSafeAvatarFilename(avatarUrl) {
  if (typeof avatarUrl !== "string" || !avatarUrl.startsWith(AVATAR_URL_PREFIX)) {
    return null;
  }

  const remainder = avatarUrl.slice(AVATAR_URL_PREFIX.length);
  if (!remainder || remainder.includes("\0")) {
    return null;
  }

  const normalized = remainder.replace(/\\/g, "/");
  if (
    normalized.includes("/") ||
    normalized.includes("..") ||
    path.basename(normalized) !== normalized
  ) {
    return null;
  }

  return normalized;
}
