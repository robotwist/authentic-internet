import express from "express";
import Artifact from "../models/Artifact.js";
import authenticateToken from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, description, content, riddle, unlockAnswer, area, isExclusive, messageText, unlockCondition } = req.body;

    const newArtifact = new Artifact({
      name,
      description,
      content,
      riddle,
      unlockAnswer,
      area,
      isExclusive,
      creator: req.user.userId,
      type: "artifact",
      messageText: messageText || "", // ✅ Message created with artifact
      sender: req.user.userId,
      recipient: null,
      unlockCondition,
    });

    await newArtifact.save();
    res.json({ message: "Artifact created successfully!", artifact: newArtifact });
  } catch (error) {
    console.error("Error creating artifact:", error);
    res.status(500).json({ error: "Failed to create artifact." });
  }
});

/** 📌 2️⃣ FETCH ALL ARTIFACTS */
router.get("/", async (req, res) => {
  try {
    const artifacts = await Artifact.find({ type: "artifact" });
    res.json(artifacts);
  } catch (error) {
    console.error("Error fetching artifacts:", error);
    res.status(500).json({ error: "Failed to fetch artifacts." });
  }
});

/** 📌 3️⃣ FETCH A SINGLE ARTIFACT BY ID */
router.get("/:id", async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id);
    if (!artifact || artifact.type !== "artifact") {
      return res.status(404).json({ error: "Artifact not found." });
    }
    res.json(artifact);
  } catch (error) {
    console.error("Error fetching artifact:", error);
    res.status(500).json({ error: "Failed to fetch artifact." });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const updatedArtifact = await Artifact.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedArtifact || updatedArtifact.type !== "artifact") {
      return res.status(404).json({ error: "Artifact not found." });
    }

    res.json({ message: "Artifact updated successfully!", artifact: updatedArtifact });
  } catch (error) {
    console.error("Error updating artifact:", error);
    res.status(500).json({ error: "Failed to update artifact." });
  }
});

router.get("/:id/message", authenticateToken, async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id);

    if (!artifact) {
      return res.status(404).json({ error: "Artifact not found." });
    }

    res.json({ messageText: artifact.messageText });
  } catch (error) {
    console.error("Error fetching message:", error);
    res.status(500).json({ error: "Failed to fetch message." });
  }
});
router.put("/:id/message", authenticateToken, async (req, res) => {
  try {
    const { messageText } = req.body;
    const artifact = await Artifact.findById(req.params.id);

    if (!artifact || artifact.type !== "artifact") {
      return res.status(404).json({ error: "Artifact not found or not an artifact type." });
    }

    artifact.messageText = messageText;
    await artifact.save();
    
    res.json({ message: "Message updated successfully!", artifact });
  } catch (error) {
    console.error("Error updating message:", error);
    res.status(500).json({ error: "Failed to update message." });
  }
});

router.delete("/:id/message", authenticateToken, async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id);

    if (!artifact) {
      return res.status(404).json({ error: "Artifact not found." });
    }

    artifact.messageText = "";
    await artifact.save();
    
    res.json({ message: "Message deleted successfully!", artifact });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Failed to delete message." });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const deletedArtifact = await Artifact.findByIdAndDelete(req.params.id);
    if (!deletedArtifact || deletedArtifact.type !== "artifact") {
      return res.status(404).json({ error: "Artifact not found." });
    }

    res.json({ message: "Artifact deleted successfully!" });
  } catch (error) {
    console.error("Error deleting artifact:", error);
    res.status(500).json({ error: "Failed to delete artifact." });
  }
});

/** 📌 6️⃣ SOLVE RIDDLE TO UNLOCK ARTIFACT */
router.post("/unlock/:id", authenticateToken, async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id);
    if (!artifact || artifact.type !== "artifact") {
      return res.status(404).json({ error: "Artifact not found." });
    }

    if (!artifact.unlockAnswer || artifact.unlockAnswer.toLowerCase() !== req.body.answer.toLowerCase()) {
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
