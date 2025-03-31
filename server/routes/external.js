import express from 'express';
import { 
  getRandomQuote,
  getQuoteByAuthor,
  getQuoteForArtifact,
  getZenQuote,
  getTodayQuote
} from '../services/apiIntegrations.js';

const router = express.Router();

// GET /quotes/random - Get a random quote
router.get('/quotes/random', async (req, res) => {
  try {
    const result = await getRandomQuote();
    res.json(result);
  } catch (error) {
    console.error('Error fetching random quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote', message: error.message });
  }
});

// GET /quotes/author/:author - Get a quote by author
router.get('/quotes/author/:author', async (req, res) => {
  try {
    const result = await getQuoteByAuthor(req.params.author);
    res.json(result);
  } catch (error) {
    console.error('Error fetching author quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote', message: error.message });
  }
});

// GET /quotes/theme/:theme - Get a quote by theme
router.get('/quotes/theme/:theme', async (req, res) => {
  try {
    const result = await getQuoteForArtifact(req.params.theme);
    res.json(result);
  } catch (error) {
    console.error('Error fetching themed quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote', message: error.message });
  }
});

// GET /quotes/zen - Get a Zen quote
router.get('/quotes/zen', async (req, res) => {
  try {
    const result = await getZenQuote();
    res.json(result);
  } catch (error) {
    console.error('Error fetching Zen quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote', message: error.message });
  }
});

// GET /quotes/today - Get today's quote
router.get('/quotes/today', async (req, res) => {
  try {
    const result = await getTodayQuote();
    res.json(result);
  } catch (error) {
    console.error('Error fetching today\'s quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote', message: error.message });
  }
});

export default router; 