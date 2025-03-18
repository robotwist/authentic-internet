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
  status: { type: String, enum: ["inventory", "dropped", "world"], default: "world" },
  
  // New fields for attachments and community interaction
  attachment: { type: String }, // Path to the uploaded attachment
  attachmentType: { type: String, enum: ["image", "audio", "document", "video"] },
  attachmentOriginalName: { type: String }, // Original filename
  
  // Community interaction fields
  votes: { type: Number, default: 0 },
  voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  views: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Update the updatedAt timestamp before saving
ArtifactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Artifact = mongoose.model("Artifact", ArtifactSchema);
export default Artifact;
