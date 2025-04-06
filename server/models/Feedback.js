import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional as anonymous feedback is allowed
  },
  name: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false
  },
  gameplay: {
    type: String,
    required: true
  },
  bugs: {
    type: String,
    required: false
  },
  visual: {
    type: String,
    required: false
  },
  performance: {
    type: String,
    required: false
  },
  suggestions: {
    type: String,
    required: false
  },
  deviceInfo: {
    screenWidth: Number,
    screenHeight: Number,
    userAgent: String,
    mapLocation: String,
    gameVersion: String,
    timestamp: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Feedback = mongoose.model('Feedback', FeedbackSchema);

export default Feedback; 