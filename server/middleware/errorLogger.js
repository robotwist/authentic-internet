// Enhanced error logger middleware to catch and report all server errors
// This will provide detailed logs for debugging CORS and other issues

const errorLogger = (req, res, next) => {
  // Store the original methods to restore them later
  const originalSend = res.send;
  const originalJson = res.json;
  const originalStatus = res.status;
  const originalEnd = res.end;
  
  // Start time for request duration calculation
  const startTime = Date.now();
  
  // Create a log entry
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    origin: req.headers.origin,
    referer: req.headers.referer,
    body: req.method !== 'GET' ? req.body : undefined,
    params: req.params,
    query: req.query,
    statusCode: null,
    responseTime: null,
    error: null
  };

  // Override status method
  res.status = function(code) {
    logEntry.statusCode = code;
    return originalStatus.apply(this, arguments);
  };

  // Override send method
  res.send = function(body) {
    logEntry.responseTime = Date.now() - startTime;
    
    // Log errors (4xx and 5xx status codes)
    if (logEntry.statusCode >= 400) {
      logEntry.response = typeof body === 'string' ? body : JSON.stringify(body);
      console.error(`[ERROR] ${logEntry.method} ${logEntry.url} ${logEntry.statusCode} - ${logEntry.responseTime}ms`);
      console.error('Request details:', JSON.stringify(logEntry, null, 2));
      
      // Special handling for CORS errors
      if (logEntry.statusCode === 403 && body && typeof body === 'object' && body.error === 'CORS Error') {
        console.error(`[CORS ERROR] Request from ${logEntry.origin} to ${logEntry.url} was blocked.`);
        console.error('Allowed origins:', process.env.NODE_ENV === 'development' 
          ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175']
          : [process.env.CLIENT_URL]);
        console.error('Fix: Add this origin to the allowedOrigins array in server.mjs');
      }
    } else {
      // For successful responses, just log a simple line
      console.log(`[INFO] ${logEntry.method} ${logEntry.url} ${logEntry.statusCode} - ${logEntry.responseTime}ms`);
    }
    
    return originalSend.apply(this, arguments);
  };

  // Override json method
  res.json = function(obj) {
    logEntry.responseTime = Date.now() - startTime;
    
    if (logEntry.statusCode >= 400) {
      logEntry.response = JSON.stringify(obj);
      console.error(`[ERROR] ${logEntry.method} ${logEntry.url} ${logEntry.statusCode} - ${logEntry.responseTime}ms`);
      console.error('Request details:', JSON.stringify(logEntry, null, 2));
      
      // Special handling for CORS errors
      if (logEntry.statusCode === 403 && obj && obj.error === 'CORS Error') {
        console.error(`[CORS ERROR] Request from ${logEntry.origin} to ${logEntry.url} was blocked.`);
        console.error('Fix: Add this origin to the allowedOrigins array in server.mjs');
      }
    } else {
      console.log(`[INFO] ${logEntry.method} ${logEntry.url} ${logEntry.statusCode} - ${logEntry.responseTime}ms`);
    }
    
    return originalJson.apply(this, arguments);
  };

  // Override end method
  res.end = function(chunk) {
    logEntry.responseTime = Date.now() - startTime;
    
    if (!logEntry.statusCode) {
      logEntry.statusCode = 200; // Default status code
    }
    
    if (logEntry.statusCode >= 400) {
      console.error(`[ERROR] ${logEntry.method} ${logEntry.url} ${logEntry.statusCode} - ${logEntry.responseTime}ms`);
    } else {
      console.log(`[INFO] ${logEntry.method} ${logEntry.url} ${logEntry.statusCode} - ${logEntry.responseTime}ms`);
    }
    
    return originalEnd.apply(this, arguments);
  };

  next();
};

export default errorLogger; 