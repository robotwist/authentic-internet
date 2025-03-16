import mongoose from "mongoose";

const ArtifactSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  name: { type: String, required: true },
  description: { type: String },
  content: { type: String },
  riddle: { type: String },
  unlockAnswer: { type: String },
  area: { type: String, required: true },
  isExclusive: { type: Boolean, default: false },
  image: { type: String, default: "/images/default-artifact.png" },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  location: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  type: { type: String, enum: ["artifact", "message"], default: "artifact" },
  messageText: { type: String, default: "" },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  isRead: { type: Boolean, default: false },
  unlockCondition: { type: String },
  exp: { type: Number, default: 0 },
  visible: { type: Boolean, default: true },
  status: { type: String, enum: ["inventory", "dropped", "world"], default: "world" }
});

const Artifact = mongoose.model("Artifact", ArtifactSchema);
export default Artifact;
