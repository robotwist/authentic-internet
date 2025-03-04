const express = require("express");
const Artifact = require("../models/Artifact");
const router = express.Router();

// CREATE Artifact
router.post("/", async (req, res) => {
  try {
    const newArtifact = new Artifact(req.body);
    await newArtifact.save();
    res.status(201).json(newArtifact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all Artifacts
router.get("/", async (req, res) => {
  try {
    const artifacts = await Artifact.find();
    res.json(artifacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
