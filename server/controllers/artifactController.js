import Artifact from "../models/Artifact.js";

// Create an artifact
export const createArtifact = async (req, res) => {
  try {
    const { name, description, content, riddle, unlockAnswer, area, isExclusive, location } = req.body;
    const user = req.user._id;

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
      location: { x: req.body.location.x, y: req.body.location.y } ,
      creator: user,
    });

    await newArtifact.save();
    res.status(201).json(newArtifact);
  } catch (error) {
    console.error("Error creating artifact:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const getArtifacts = async (req, res) => {
  try {
    const artifacts = await Artifact.find().populate('creator', 'username');
    res.json(artifacts);
  } catch (error) {
    console.error("Error fetching artifacts:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getArtifactById = async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id).populate('creator', 'username');
    if (!artifact) return res.status(404).json({ message: "Artifact not found" });
    res.json(artifact);
  } catch (error) {
    console.error("Error fetching artifact:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update an artifact
export const updateArtifact = async (req, res) => {
  try {
    const updatedArtifact = await Artifact.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    ).populate('creator', 'username');
    
    if (!updatedArtifact) return res.status(404).json({ message: "Artifact not found" });
    res.json(updatedArtifact);
  } catch (error) {
    console.error("Error updating artifact:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Unlock an artifact (for hidden items)
export const unlockArtifact = async (req, res) => {
  try {
    const { answer } = req.body;
    const artifact = await Artifact.findById(req.params.id);
    
    if (!artifact) return res.status(404).json({ error: "Artifact not found" });
    
    // Check if answer is correct if provided
    if (artifact.unlockAnswer && answer !== artifact.unlockAnswer) {
      return res.status(400).json({ error: "Incorrect answer" });
    }

    artifact.visibility = "open";
    await artifact.save();
    res.json({ success: true, message: "Artifact unlocked!" });
  } catch (error) {
    console.error("Error unlocking artifact:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete an artifact
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

// Get artifacts by area
export const getArtifactsByArea = async (req, res) => {
  try {
    const { area } = req.params;
    const artifacts = await Artifact.find({ area }).populate('creator', 'username');
    res.json(artifacts);
  } catch (error) {
    console.error("Error fetching artifacts by area:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
