const express = require("express");
const Artifact = require("../models/Artifact");

const router = express.Router();

// Create Artifact with Visibility Options
router.post("/", async (req, res) => {
  try {
    const { content, type, visibility, unlockMethod, unlockKey, location } = req.body;

    const newArtifact = new Artifact({
      content,
      type,
      visibility: visibility || "open",
      unlockMethod: unlockMethod || "none",
      unlockKey: unlockKey || null,
      location: {
        x: location?.x || 0,
        y: location?.y || 0,
        scene: location?.scene || "Overworld",
        latitude: location?.latitude || null,
        longitude: location?.longitude || null
      },
    });

    await newArtifact.save();
    res.status(201).json(newArtifact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch Artifacts (Filter based on Visibility)
router.get("/", async (req, res) => {
  try {
    const artifacts = await Artifact.find();

    // Filter artifacts: show 'open', hide 'hidden' unless unlocked, and lock 'locked'
    const visibleArtifacts = artifacts.map(artifact => {
      if (artifact.visibility === "hidden") {
        return { ...artifact._doc, content: "[Hidden Artifact]" };
      }
      if (artifact.visibility === "locked") {
        return { ...artifact._doc, content: "[Locked Artifact]" };
      }
      return artifact;
    });

    res.json(visibleArtifacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;