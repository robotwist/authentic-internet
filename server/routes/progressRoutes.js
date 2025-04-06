import express from 'express';
import { awardExperience, discoverArtifact, saveGameState, getUserProgress } from '../controllers/progressController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Experience and progression routes
router.post('/experience', awardExperience);
router.post('/artifact/:artifactId/discover', discoverArtifact);
router.post('/save', saveGameState);
router.get('/user', getUserProgress);

export default router; 