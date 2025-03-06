const express = require("express");
const router = express.Router();
const Artifact = require("../models/Artifact");

// 📌 GET all artifacts
router.get("/", async (req, res) => {
  try {
    const artifacts = await Artifact.find();
    res.json(artifacts);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📌 POST new artifact
router.post("/", async (req, res) => {
  try {
    console.log("POST /api/artifacts called:", req.body); // Debugging log

    // Check if required fields are present
    if (!req.body.content || !req.body.location) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newArtifact = new Artifact(req.body);
    await newArtifact.save();
    res.status(201).json(newArtifact);
  } catch (error) {
    console.error("Error creating artifact:", error);
    res.status(500).json({ error: "Could not create artifact" });
  }
});

// 📌 GET single artifact by ID
router.get("/:id", async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id);
    if (!artifact) return res.status(404).json({ error: "Artifact not found" });
    res.json(artifact);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📌 PUT (Unlock artifact)
router.put("/:id/unlock", async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id);
    if (!artifact) return res.status(404).json({ error: "Artifact not found" });

    artifact.visibility = "open";
    await artifact.save();
    res.json({ success: true, message: "Artifact unlocked!" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📌 DELETE an artifact
router.delete("/:id", async (req, res) => {
  try {
    const deletedArtifact = await Artifact.findByIdAndDelete(req.params.id);
    if (!deletedArtifact) return res.status(404).json({ error: "Artifact not found" });
    res.json({ success: true, message: "Artifact deleted!" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
