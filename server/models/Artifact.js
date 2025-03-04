const mongoose = require("mongoose");

const ArtifactSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  content: String,
  type: { type: String, enum: ["text", "pixel", "code"], required: true },
  location: { x: Number, y: Number, scene: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Artifact", ArtifactSchema);
