import mongoose from "mongoose";

const ArtifactSchema = new mongoose.Schema({
  name: { type: String, required: false }, // Not needed for messages
  description: { type: String },
  content: { type: String }, 
  riddle: { type: String },
  unlockAnswer: { type: String },
  area: { type: String, required: true },
  isExclusive: { type: Boolean, default: false },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // NEW: Messaging system
  type: { type: String, enum: ["artifact", "message"], default: "artifact" },
  messageText: { type: String }, 
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isRead: { type: Boolean, default: false },
  unlockCondition: { type: String }
});

const Artifact = mongoose.model("Artifact", ArtifactSchema);
export default Artifact;
