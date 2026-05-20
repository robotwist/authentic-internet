import express from "express";

const router = express.Router();

/**
 * POST /api/diagnostics/errors
 * Receive and log client-side errors
 */
router.post("/errors", (req, res) => {
  try {
    const { error, errorInfo, componentStack, timestamp } = req.body;
    
    console.error('[Client Error]', {
      timestamp: timestamp || new Date().toISOString(),
      error,
      errorInfo,
      componentStack,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
    
    res.status(200).json({ 
      message: "Error logged successfully" 
    });
  } catch (err) {
    console.error('Error logging client error:', err);
    res.status(500).json({ 
      error: "Failed to log error" 
    });
  }
});

/**
 * POST /api/errors/report
 * Alternative endpoint for error reporting
 */
router.post("/report", (req, res) => {
  try {
    const errorData = req.body;
    
    console.error('[Client Error Report]', {
      timestamp: new Date().toISOString(),
      ...errorData,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
    
    res.status(200).json({ 
      message: "Error reported successfully" 
    });
  } catch (err) {
    console.error('Error reporting client error:', err);
    res.status(500).json({ 
      error: "Failed to report error" 
    });
  }
});

export default router;
