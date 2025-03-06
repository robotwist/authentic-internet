const mongoose = require("mongoose");

const ArtifactSchema = new mongoose.Schema({
  content: { type: String, required: true },  // ✅ Required field
  location: {  
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    scene: { type: String, required: false }, // Optional
  },
  visibility: { type: String, enum: ["open", "hidden", "locked"], default: "open" },
  unlockMethod: { type: String, default: "none" }, 
  unlockKey: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Artifact", ArtifactSchema);
