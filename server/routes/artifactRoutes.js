import express from "express";
import { createArtifact, getArtifacts, updateArtifact, unlockArtifact, deleteArtifact } from "../controllers/artifactController.js";
import authMiddleware from "../middleware/authMiddleware.js"; // Ensure this is correctly imported

const router = express.Router();

// ✅ CREATE an artifact (🔐 Requires Authentication)
router.post("/", authMiddleware, createArtifact);

// ✅ GET all artifacts (Public)
router.get("/", getArtifacts);

// ✅ UNLOCK an artifact (Public)
router.put("/:id/unlock", unlockArtifact);

// ✅ UPDATE an artifact (🔐 Requires Authentication)
router.put("/:id", authMiddleware, updateArtifact);

// ✅ DELETE an artifact (🔐 Requires Authentication)
router.delete("/:id", authMiddleware, deleteArtifact);

export default router;
