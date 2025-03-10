import express from "express";
import { createArtifact, getArtifacts, updateArtifact, unlockArtifact, deleteArtifact } from "../controllers/artifactController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createArtifact);

router.get("/", getArtifacts);

router.put("/:id/unlock", unlockArtifact);

router.put("/:id", authMiddleware, updateArtifact);

router.delete("/:id", authMiddleware, deleteArtifact);

export default router;
