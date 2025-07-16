import mongoose from 'mongoose';

const ArtifactInteractionSchema = new mongoose.Schema({
  type: { type: String, required: true },
  condition: String,
  revealedContent: String,
  action: String
}, { _id: false });

const ReviewSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: String,
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const ArtifactSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  content: { type: String, required: true },
  media: [String],
  location: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    mapName: String
  },
  exp: { type: Number, default: 0 },
  visible: { type: Boolean, default: true },
  area: { type: String, required: true },
  interactions: [ArtifactInteractionSchema],
  properties: { type: mongoose.Schema.Types.Mixed },
  userModifiable: { type: mongoose.Schema.Types.Mixed },
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  tags: [String],
  rating: Number,
  reviews: [ReviewSchema],
  remixOf: String
});

export default mongoose.model('Artifact', ArtifactSchema);
