import express from 'express';
import { 
  fetchShakespeareQuote, 
  fetchQuote, 
  fetchOscarWildeQuote, 
  fetchAlexanderPopeQuote, 
  fetchMichelangeloQuote, 
  fetchJesusQuote, 
  fetchJohnMuirQuote 
} from '../services/apiIntegrations.js';

const router = express.Router();

// GET /shakespeare - Fetch a Shakespeare quote (no auth required)
router.get('/shakespeare', async (req, res) => {
  try {
    const prompt = req.query.prompt || '';
    const result = await fetchShakespeareQuote(prompt);
    
    res.json({
      text: result.quote || 'No quote available',
      source: result.author ? `${result.author}, ${result.work || 'Unknown work'}` : 'Unknown source',
      work: result.work || 'Various works',
      character: result.character || 'Unknown character',
      additionalQuotes: result.additionalQuotes || []
    });
  } catch (error) {
    console.error('Error fetching Shakespeare quote:', error);
    res.status(500).json({ error: 'Failed to fetch Shakespeare quote', message: error.message });
  }
});

// GET /wilde - Fetch an Oscar Wilde quote (no auth required)
router.get('/wilde', async (req, res) => {
  try {
    const prompt = req.query.prompt || '';
    const result = await fetchOscarWildeQuote(prompt);
    
    res.json({
      text: result.quote || 'No quote available',
      source: result.author ? `${result.author}, ${result.work || 'Unknown work'}` : 'Oscar Wilde',
      work: result.work || 'Various works',
      character: result.character || 'Unknown character',
      additionalQuotes: result.additionalQuotes || []
    });
  } catch (error) {
    console.error('Error fetching Oscar Wilde quote:', error);
    res.status(500).json({ error: 'Failed to fetch Oscar Wilde quote', message: error.message });
  }
});

// GET /pope - Fetch an Alexander Pope quote (no auth required)
router.get('/pope', async (req, res) => {
  try {
    const prompt = req.query.prompt || '';
    const result = await fetchAlexanderPopeQuote(prompt);
    
    res.json({
      text: result.quote || 'No quote available',
      source: result.author ? `${result.author}, ${result.work || 'Unknown work'}` : 'Alexander Pope',
      work: result.work || 'Various works',
      character: result.character || 'Unknown character',
      additionalQuotes: result.additionalQuotes || []
    });
  } catch (error) {
    console.error('Error fetching Alexander Pope quote:', error);
    res.status(500).json({ error: 'Failed to fetch Alexander Pope quote', message: error.message });
  }
});

// GET /michelangelo - Fetch a Michelangelo quote (no auth required)
router.get('/michelangelo', async (req, res) => {
  try {
    const prompt = req.query.prompt || '';
    const result = await fetchMichelangeloQuote(prompt);
    
    res.json({
      text: result.quote || 'No quote available',
      source: result.author ? `${result.author}, ${result.work || 'Unknown work'}` : 'Michelangelo',
      work: result.work || 'Various works',
      character: result.character || 'Unknown character',
      additionalQuotes: result.additionalQuotes || []
    });
  } catch (error) {
    console.error('Error fetching Michelangelo quote:', error);
    res.status(500).json({ error: 'Failed to fetch Michelangelo quote', message: error.message });
  }
});

// GET /jesus - Fetch a Jesus quote (no auth required)
router.get('/jesus', async (req, res) => {
  try {
    const prompt = req.query.prompt || '';
    const result = await fetchJesusQuote(prompt);
    
    res.json({
      text: result.quote || 'No quote available',
      source: result.author ? `${result.author}, ${result.work || 'Unknown work'}` : 'Jesus',
      work: result.work || 'The Bible',
      character: result.character || 'Jesus',
      additionalQuotes: result.additionalQuotes || []
    });
  } catch (error) {
    console.error('Error fetching Jesus quote:', error);
    res.status(500).json({ error: 'Failed to fetch Jesus quote', message: error.message });
  }
});

// GET /john_muir - Fetch a John Muir quote (no auth required)
router.get('/john_muir', async (req, res) => {
  try {
    const prompt = req.query.prompt || '';
    const result = await fetchJohnMuirQuote(prompt);
    
    res.json({
      text: result.quote || 'No quote available',
      source: result.author ? `${result.author}, ${result.work || 'Unknown work'}` : 'John Muir',
      work: result.work || 'Various works',
      character: result.character || 'John Muir',
      additionalQuotes: result.additionalQuotes || []
    });
  } catch (error) {
    console.error('Error fetching John Muir quote:', error);
    res.status(500).json({ error: 'Failed to fetch John Muir quote', message: error.message });
  }
});

// GET /quote - Fetch a quote by author or tags (no auth required)
router.get('/quote', async (req, res) => {
  try {
    const author = req.query.author || '';
    const tags = req.query.tags || '';
    
    const result = await fetchQuote(author, tags);
    
    res.json({
      text: result.content || result.quote || 'No quote available',
      source: result.author ? `${result.author}` : 'Unknown author',
      work: result.work || 'Unknown work',
      tags: result.tags || [],
      additionalQuotes: []
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote', message: error.message });
  }
});

// GET /zen - Get a random zen quote
router.get('/zen', (req, res) => {
  try {
    const zenQuotes = [
      "Before enlightenment, chop wood, carry water. After enlightenment, chop wood, carry water.",
      "The obstacle is the path.",
      "When you reach the top of the mountain, keep climbing.",
      "The quieter you become, the more you can hear.",
      "If you understand, things are just as they are. If you do not understand, things are just as they are.",
      "Wherever you are, it is the place you need to be.",
      "When thoughts arise, then do all things arise. When thoughts vanish, then do all things vanish.",
      "The journey of a thousand miles begins with a single step.",
      "No snowflake ever falls in the wrong place.",
      "When you realize nothing is lacking, the whole world belongs to you."
    ];
    
    const randomQuote = zenQuotes[Math.floor(Math.random() * zenQuotes.length)];
    
    res.json({
      text: randomQuote,
      source: "Zen wisdom",
      work: "Traditional teaching",
      additionalQuotes: []
    });
  } catch (error) {
    console.error('Error serving zen quote:', error);
    res.status(500).json({ error: 'Failed to fetch zen quote', message: error.message });
  }
});

export default router; 