import express from 'express';
import { submitFeedback, getAllFeedback } from '../controllers/feedbackController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public route for submitting feedback (no auth required)
router.post('/', submitFeedback);

// Admin route to get all feedback (requires authentication)
router.get('/', authenticate, getAllFeedback);

export default router; 