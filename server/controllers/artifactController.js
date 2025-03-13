import Artifact from "../models/Artifact.js";

// ✅ Create an artifact
export const createArtifact = async (req, res) => {
  try {
    const { name, description, content, riddle, unlockAnswer, area, isExclusive, location } = req.body;
    const user = req.user._id;

    console.log("Incoming request data:", req.body);
    console.log("User ID:", user);

    if (!name || !content || !area || !location || !location.x || !location.y) {
      return res.status(400).json({ message: "Name, content, area, and location are required." });
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
      creator: user,
    });

    await newArtifact.save();
    res.status(201).json(newArtifact);
  } catch (error) {
    console.error("Error creating artifact:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// ✅ Get all artifacts
export const getArtifacts = async (req, res) => {
  try {
    const artifacts = await Artifact.find();
    res.json(artifacts);
  } catch (error) {
    console.error("Error fetching artifacts:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Update an artifact
export const updateArtifact = async (req, res) => {
  try {
    const updatedArtifact = await Artifact.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedArtifact) return res.status(404).json({ message: "Artifact not found" });
    res.json(updatedArtifact);
  } catch (error) {
    console.error("Error updating artifact:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Unlock an artifact (for hidden items)
export const unlockArtifact = async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id);
    if (!artifact) return res.status(404).json({ error: "Artifact not found" });

    artifact.visibility = "open";
    await artifact.save();
    res.json({ success: true, message: "Artifact unlocked!" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Delete an artifact
export const deleteArtifact = async (req, res) => {
  try {
    const deletedArtifact = await Artifact.findByIdAndDelete(req.params.id);
    if (!deletedArtifact) return res.status(404).json({ message: "Artifact not found" });
    res.json({ message: "Artifact deleted successfully" });
  } catch (error) {
    console.error("Error deleting artifact:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
