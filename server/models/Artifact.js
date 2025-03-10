import mongoose from "mongoose";

const ArtifactSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true },
    location: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      scene: { type: String, default: "Overworld" }, 
    },
    visibility: {
      type: String,
      enum: ["open", "hidden", "locked"],
      default: "open",
    },
    unlockMethod: {
      type: String,
      enum: ["none", "password", "riddle", "movement"],
      default: "none",
    },
    unlockKey: { type: String, default: null },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

ArtifactSchema.index({ location: 1 });
ArtifactSchema.index({ user: 1 });

const Artifact = mongoose.model("Artifact", ArtifactSchema);

export default Artifact;
