import Artifact from "../models/Artifact.js";

// Create an artifact
export const createArtifact = async (req, res) => {
  try {
    const { name, description, content, riddle, unlockAnswer, area, isExclusive, location } = req.body;
    const user = req.user._id;

    if (!name || !content || !area || !location || location.x === undefined || location.y === undefined) {
      return res.status(400).json({ message: "Name, content, area, and location (x, y) are required." });
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
    res.status(201).json({ ...newArtifact.toObject(), id: newArtifact._id });
  } catch (error) {
    console.error("Error creating artifact:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
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
