import Artifact from "../models/Artifact.js";
import User from "../models/User.js";

// Create an artifact. First is free; 2nd+ require 1 creation token (earned by completing others' artifacts).
export const createArtifact = async (req, res) => {
  try {
    const userId = req.user?.userId ?? req.user?.id ?? req.user?._id;
    const uid = userId?.toString?.();
    if (!uid) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const { name, description, content, riddle, unlockAnswer, area, isExclusive, location, type, createdBy } = req.body;
    const resolvedCreatedBy = createdBy || uid;

    if (!name || !content || !area || !location || location.x === undefined || location.y === undefined) {
      return res.status(400).json({ message: "Name, content, area, and location (x, y) are required." });
    }

    const existingCount = await Artifact.countDocuments({ createdBy: uid });

    const newArtifact = new Artifact({
      name,
      description: description ?? "",
      content,
      riddle,
      unlockAnswer,
      area,
      isExclusive,
      location,
      type: type || "artifact",
      createdBy: resolvedCreatedBy,
      id: `artifact-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    });

    await newArtifact.save();

    // Deduct 1 creation token when creating 2nd+ artifact
    if (existingCount >= 1) {
      await User.findByIdAndUpdate(userId, {
        $inc: { creationTokens: -1 },
      });
    }

    res.status(201).json({ ...newArtifact.toObject(), id: newArtifact._id });
  } catch (error) {
    console.error("Error creating artifact:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

/** GET /api/artifacts/creation-status — returns canCreate, creationTokens, artifactsCreated (for 2nd-artifact token gating). */
export const getCreationStatus = async (req, res) => {
  try {
    const userId = req.user?.userId ?? req.user?.id ?? req.user?._id;
    const uid = userId?.toString?.();
    if (!uid) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const [user, artifactsCreated] = await Promise.all([
      User.findById(userId).select("creationTokens").lean(),
      Artifact.countDocuments({ createdBy: uid }),
    ]);

    const tokens = Math.max(0, Number(user?.creationTokens) ?? 0);
    const canCreate = artifactsCreated === 0 || tokens >= 1;

    res.json({
      success: true,
      canCreate,
      creationTokens: tokens,
      artifactsCreated,
      message:
        artifactsCreated === 0
          ? "Your first artifact is free."
          : tokens >= 1
            ? `You have ${tokens} creation token(s).`
            : "Complete an artifact you didn't create to earn a creation token for your next artifact.",
    });
  } catch (err) {
    console.error("getCreationStatus error:", err);
    res.status(500).json({ success: false, message: err?.message ?? "Failed to get creation status." });
  }
};

// Get all artifacts
export const getArtifacts = async (req, res) => {
  try {
    const artifacts = await Artifact.find().populate('creator', 'username');
    res.json(artifacts.map(artifact => ({ ...artifact.toObject(), id: artifact._id })));
  } catch (error) {
    console.error("Error fetching artifacts:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Get artifact by ID
export const getArtifactById = async (req, res) => {
  try {
    const { id } = req.params;
    const artifact = await Artifact.findById(id).populate('creator', 'username');
    if (!artifact) return res.status(404).json({ message: "Artifact not found" });
    res.json({ ...artifact.toObject(), id: artifact._id });
  } catch (error) {
    console.error("Error fetching artifact:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Update an artifact
export const updateArtifact = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedArtifact = await Artifact.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true, runValidators: true }
    ).populate('creator', 'username');
    
    if (!updatedArtifact) return res.status(404).json({ message: "Artifact not found" });
    res.json({ ...updatedArtifact.toObject(), id: updatedArtifact._id });
  } catch (error) {
    console.error("Error updating artifact:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Unlock an artifact (for hidden items)
export const unlockArtifact = async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;
    const artifact = await Artifact.findById(id);
    
    if (!artifact) return res.status(404).json({ message: "Artifact not found" });
    
    // Check if answer is correct if provided
    if (artifact.unlockAnswer && answer !== artifact.unlockAnswer) {
      return res.status(400).json({ message: "Incorrect answer" });
    }

    artifact.visibility = "open";
    await artifact.save();
    res.json({ success: true, message: "Artifact unlocked!", id: artifact._id });
  } catch (error) {
    console.error("Error unlocking artifact:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Delete an artifact
export const deleteArtifact = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedArtifact = await Artifact.findByIdAndDelete(id);
    if (!deletedArtifact) return res.status(404).json({ message: "Artifact not found" });
    res.json({ message: "Artifact deleted successfully", id: deletedArtifact._id });
  } catch (error) {
    console.error("Error deleting artifact:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Add a comment to an artifact
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const artifact = await Artifact.findById(id);
    if (!artifact) {
      return res.status(404).json({ message: "Artifact not found" });
    }

    const newComment = {
      user: userId,
      content: content.trim(),
      createdAt: new Date()
    };

    artifact.comments = artifact.comments || [];
    artifact.comments.push(newComment);

    await artifact.save();
    await artifact.populate('comments.user', 'username');

    res.status(201).json({
      message: "Comment added successfully",
      comment: newComment
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Get artifacts by area
export const getArtifactsByArea = async (req, res) => {
  try {
    const { area } = req.params;
    const artifacts = await Artifact.find({ area }).populate('creator', 'username');
    res.json(artifacts.map(artifact => ({ ...artifact.toObject(), id: artifact._id })));
  } catch (error) {
    console.error("Error fetching artifacts by area:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Stub implementations for missing functions
export const createCreativeArtifact = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const getGameProgress = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const saveGameProgress = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

/** Mark artifact complete, update user progress, award +1 creation token when completing another user's artifact (first time only). */
export const completeArtifact = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId ?? req.user?.id ?? req.user?._id;
    const uid = userId?.toString?.();
    if (!uid) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const artifact = await Artifact.findById(id).lean();
    if (!artifact) {
      return res.status(404).json({ success: false, message: "Artifact not found." });
    }

    const creatorId = (artifact.createdBy ?? artifact.creator)?.toString?.();
    const { score = 0, attempts = 1, timeSpent = 0 } = req.body ?? {};

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const alreadyCompleted = (user.completedArtifacts ?? []).some(
      (c) => c.artifactId?.toString?.() === id
    );

    user.completeArtifact(id, score, attempts, timeSpent);
    await user.save();

    let creationTokenAwarded = false;
    if (creatorId && creatorId !== uid && !alreadyCompleted) {
      await User.findByIdAndUpdate(userId, { $inc: { creationTokens: 1 } });
      creationTokenAwarded = true;
    }

    res.status(200).json({
      success: true,
      message: "Artifact completed.",
      rewards: { creationTokenAwarded },
    });
  } catch (err) {
    console.error("completeArtifact error:", err);
    res.status(500).json({ success: false, message: err.message || "Completion failed." });
  }
};

export const completeArtifactWithRewards = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const getHint = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const getInteractiveHint = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const getPlayerProgress = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const savePlayerProgress = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const voteOnArtifact = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const recordView = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const recordShare = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const recordInteraction = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const rateArtifact = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const addToCollection = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const getMessage = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const updateMessage = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const deleteMessage = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const seedArtifacts = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const getMarketplace = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const shareArtifact = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const unshareArtifact = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const discoverArtifact = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const listInMarketplace = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const removeFromMarketplace = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const getFeatured = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};

export const searchArtifacts = async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
};
