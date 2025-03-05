const mongoose = require("mongoose");

const ArtifactSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  content: { type: String, required: true },
  type: { type: String, enum: ["text", "pixel", "code"], required: true },
  visibility: { type: String, enum: ["open", "hidden", "locked"], default: "open" },  // New Visibility Field
  unlockMethod: { type: String, enum: ["none", "password", "location", "puzzle"], default: "none" }, // How to unlock
  unlockKey: { type: String }, // Stores password or required action
  location: { 
    x: Number, 
    y: Number, 
    scene: String,
    latitude: Number,
    longitude: Number
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Artifact", ArtifactSchema);
