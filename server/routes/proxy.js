import express from 'express';
import axios from 'axios';

const router = express.Router();

// Proxy route to handle external API requests and avoid CORS issues
router.post('/', async (req, res) => {
  try {
    const { url, method = 'GET', headers = {}, data = null } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Only allow specific domains to be proxied (security measure)
    const allowedDomains = [
      'folgerdigitaltexts.org',
      'api.quotable.io',
      'zenquotes.io',
      'quotes.rest'
    ];
    
    const urlObj = new URL(url);
    if (!allowedDomains.some(domain => urlObj.hostname.includes(domain))) {
      return res.status(403).json({ 
        error: 'Domain not allowed for proxying',
        message: `${urlObj.hostname} is not in the list of allowed domains`
      });
    }
    
    // Make the external request
    const response = await axios({
      method,
      url,
      headers,
      data,
      timeout: 10000, // 10 second timeout
    });
    
    // Return the response
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy request failed:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status outside the 2xx range
      res.status(error.response.status).json({
        error: 'External API error',
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response was received
      res.status(504).json({
        error: 'External API timeout',
        message: 'No response received from external API'
      });
    } else {
      // Something happened in setting up the request
      res.status(500).json({
        error: 'Proxy request error',
        message: error.message
      });
    }
  }
});

// Simple GET proxy endpoint with query parameter
router.get('/', async (req, res) => {
  try {
    const url = req.query.url;
    
    if (!url) {
      return res.status(400).json({ error: 'URL query parameter is required' });
    }
    
    // Only allow specific domains to be proxied (security measure)
    const allowedDomains = [
      'folgerdigitaltexts.org',
      'api.quotable.io',
      'zenquotes.io',
      'quotes.rest'
    ];
    
    const urlObj = new URL(url);
    if (!allowedDomains.some(domain => urlObj.hostname.includes(domain))) {
      return res.status(403).json({ error: 'Domain not allowed for proxying' });
    }
    
    // Make the external request
    const response = await axios.get(url, { timeout: 5000 });
    
    // Return the response
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('GET proxy request failed:', error);
    res.status(500).json({ error: 'Proxy request failed', message: error.message });
  }
});

export default router; 