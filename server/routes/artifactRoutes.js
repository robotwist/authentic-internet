import express from "express";
import Artifact from "../models/Artifact.js";
import authenticateToken from "../middleware/authMiddleware.js";

const router = express.Router();

// 📌 1️⃣ GET /api/artifacts (Fetch All Artifacts)
router.get("/", async (req, res) => {
  try {
    const artifacts = await Artifact.find({});
    if (!artifacts || artifacts.length === 0) {
      return res.status(404).json({ message: "No artifacts found." });
    }
    res.json(artifacts);
  } catch (error) {
    console.error("Error fetching artifacts:", error);
    res.status(500).json({ error: "Failed to fetch artifacts." });
  }
});

// 📌 2️⃣ POST /api/artifacts (Leave an Artifact)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, description, content, riddle, unlockAnswer, area, isExclusive, location } = req.body;
    if (!name || !content || !area || !location || !location.x || !location.y) {
      return res.status(400).json({ error: "Name, content, area, and location are required." });
    }
    
    const newArtifact = new Artifact({
      name,
      description,
      content,
      riddle,
      unlockAnswer,
      area,
      isExclusive,
      location,
      creator: req.user.userId,
    });

    await newArtifact.save();
    res.status(201).json({ message: "Artifact created successfully!", artifact: newArtifact });
  } catch (error) {
    console.error("Error creating artifact:", error);
    res.status(500).json({ error: "Failed to create artifact." });
  }
});

// 📌 3️⃣ GET /api/artifacts/:id (Fetch Single Artifact by ID)
router.get("/:id", async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id);
    if (!artifact) {
      return res.status(404).json({ error: "Artifact not found." });
    }
    res.json(artifact);
  } catch (error) {
    console.error("Error fetching artifact:", error);
    res.status(500).json({ error: "Failed to fetch artifact." });
  }
});

// 📌 4️⃣ PUT /api/artifacts/:id (Update an Artifact)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const updatedArtifact = await Artifact.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedArtifact) {
      return res.status(404).json({ error: "Artifact not found." });
    }
    res.json({ message: "Artifact updated successfully!", artifact: updatedArtifact });
  } catch (error) {
    console.error("Error updating artifact:", error);
    res.status(500).json({ error: "Failed to update artifact." });
  }
});

// 📌 5️⃣ DELETE /api/artifacts/:id (Delete an Artifact)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const deletedArtifact = await Artifact.findByIdAndDelete(req.params.id);
    if (!deletedArtifact) {
      return res.status(404).json({ error: "Artifact not found." });
    }
    res.json({ message: "Artifact deleted successfully!" });
  } catch (error) {
    console.error("Error deleting artifact:", error);
    res.status(500).json({ error: "Failed to delete artifact." });
  }
});

// 📌 6️⃣ POST /api/artifacts/unlock/:id (Solve Riddle to Claim)
router.post("/unlock/:id", authenticateToken, async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id);
    if (!artifact) return res.status(404).json({ error: "Artifact not found." });

    if (!artifact.riddle || !artifact.unlockAnswer) {
      return res.status(400).json({ error: "This artifact does not require unlocking." });
    }

    if (artifact.unlockAnswer.toLowerCase() !== req.body.answer.toLowerCase()) {
      return res.status(400).json({ error: "Incorrect answer. Try again!" });
    }

    if (artifact.isExclusive) {
      artifact.foundBy = req.user.userId;
      await artifact.save();
    }

    res.json({ message: "You unlocked the artifact!", artifact });
  } catch (error) {
    console.error("Error unlocking artifact:", error);
    res.status(500).json({ error: "Failed to unlock artifact." });
  }
});

export default router;