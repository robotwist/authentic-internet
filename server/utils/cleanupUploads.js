import fs from "fs";

/**
 * Collect absolute paths written by multer (single or fields upload).
 */
export function collectUploadedPaths(req) {
  const paths = [];

  if (req?.file?.path) {
    paths.push(req.file.path);
  }

  if (req?.files) {
    if (Array.isArray(req.files)) {
      for (const file of req.files) {
        if (file?.path) paths.push(file.path);
      }
    } else {
      for (const fieldFiles of Object.values(req.files)) {
        if (!Array.isArray(fieldFiles)) continue;
        for (const file of fieldFiles) {
          if (file?.path) paths.push(file.path);
        }
      }
    }
  }

  return [...new Set(paths)];
}

/**
 * Best-effort unlink for temporary multer files that were never persisted.
 */
export function cleanupUploadedFiles(req) {
  const paths = collectUploadedPaths(req);
  for (const filePath of paths) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error("Failed to cleanup uploaded file:", filePath, err.message);
    }
  }
  return paths;
}

/**
 * Map multer artifact fields onto artifact document fields.
 * Returns true when at least one uploaded file was applied.
 */
export function applyArtifactUploads(req, target = {}) {
  const files = req?.files;
  if (!files || Array.isArray(files)) {
    return false;
  }

  let applied = false;
  const attachment = files.attachment?.[0];
  const icon = files.artifactIcon?.[0];

  if (attachment?.filename) {
    target.attachment = `/uploads/artifacts/${attachment.filename}`;
    target.attachmentOriginalName = attachment.originalname;
    target.attachmentType = attachmentTypeFromMime(attachment.mimetype);
    applied = true;
  }

  if (icon?.filename) {
    target.image = `/uploads/icons/${icon.filename}`;
    applied = true;
  }

  return applied;
}

function attachmentTypeFromMime(mime = "") {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  return "document";
}
