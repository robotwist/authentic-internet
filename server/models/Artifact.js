import mongoose from "mongoose";

const ArtifactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  content: { type: String, required: true },
  riddle: String,
  unlockAnswer: String,
  area: { type: String, required: true, default: "Overworld" },  // ✅ Default area
  isExclusive: { type: Boolean, default: false },
  location: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  visibility: { type: String, enum: ["hidden", "locked", "open"], default: "hidden" }
}, { timestamps: true });

const Artifact = mongoose.model("Artifact", ArtifactSchema);
export default Artifact;