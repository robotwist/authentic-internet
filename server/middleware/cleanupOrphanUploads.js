import { cleanupUploadedFiles } from "../utils/cleanupUploads.js";

/**
 * After multer writes files to disk, schedule cleanup unless a later handler
 * marks req.uploadsPersisted = true (successful attach to a durable record).
 *
 * Without this, failed validation / auth / controller paths leave orphans
 * under public/uploads that can fill the disk.
 */
export function cleanupOrphanUploads(req, res, next) {
  let settled = false;

  const maybeCleanup = () => {
    if (settled) return;
    settled = true;
    if (req.uploadsPersisted) return;
    cleanupUploadedFiles(req);
  };

  res.on("finish", maybeCleanup);
  res.on("close", maybeCleanup);
  next();
}

export default cleanupOrphanUploads;
