import express from 'express';
import axios from 'axios';
import { validateProxyUrl } from '../utils/proxyAllowlist.js';

const router = express.Router();

const ALLOWED_METHODS = new Set(['GET', 'HEAD']);

async function forwardAllowedRequest(req, res, urlString, method = 'GET') {
  const validation = validateProxyUrl(urlString);
  if (!validation.ok) {
    return res.status(validation.error === 'URL is required' || validation.error === 'Invalid URL' ? 400 : 403).json({
      error: validation.error,
      ...(validation.message ? { message: validation.message } : {}),
    });
  }

  const normalizedMethod = String(method || 'GET').toUpperCase();
  if (!ALLOWED_METHODS.has(normalizedMethod)) {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Proxy only allows GET and HEAD requests',
    });
  }

  try {
    const response = await axios({
      method: normalizedMethod,
      url: validation.url.toString(),
      timeout: 10000,
      maxRedirects: 0,
      validateStatus: () => true,
      // Do not forward client-controlled headers/body — prevents header injection / request smuggling via proxy.
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'AuthenticInternet-Proxy/1.0',
      },
      responseType: 'json',
      transitional: {
        // Prefer failing closed on ambiguous responses
        forcedJSONParsing: false,
      },
    });

    const contentType = String(response.headers['content-type'] || '');
    if (contentType.includes('application/json')) {
      return res.status(response.status).json(response.data);
    }

    return res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Proxy request failed:', error.message);

    if (error.response) {
      return res.status(error.response.status).json({
        error: 'External API error',
        status: error.response.status,
      });
    }

    if (error.request) {
      return res.status(504).json({
        error: 'External API timeout',
        message: 'No response received from external API',
      });
    }

    return res.status(500).json({
      error: 'Proxy request error',
      message: error.message,
    });
  }
}

// Proxy route to handle external API requests and avoid CORS issues
router.post('/', async (req, res) => {
  const { url, method = 'GET' } = req.body || {};
  return forwardAllowedRequest(req, res, url, method);
});

// Simple GET proxy endpoint with query parameter
router.get('/', async (req, res) => {
  return forwardAllowedRequest(req, res, req.query.url, 'GET');
});

export default router;
