import winston from 'winston';
import { createLogger, format, transports } from 'winston';

// Custom log format
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.json(),
  format.printf(({ timestamp, level, message, stack, ...meta }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''} ${stack || ''}`;
  })
);

// Create logger instance
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    // File transport for errors
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // File transport for all logs
    new transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Performance monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTimes: [],
      activeConnections: 0,
      memoryUsage: [],
      cpuUsage: []
    };
    this.startTime = Date.now();
  }

  // Track request metrics
  trackRequest(req, res, next) {
    const start = Date.now();
    this.metrics.requests++;

    // Track response time
    res.on('finish', () => {
      const duration = Date.now() - start;
      this.metrics.responseTimes.push(duration);

      // Keep only last 1000 response times
      if (this.metrics.responseTimes.length > 1000) {
        this.metrics.responseTimes.shift();
      }

      // Log slow requests
      if (duration > 1000) {
        logger.warn('Slow request detected', {
          method: req.method,
          url: req.url,
          duration,
          userAgent: req.get('User-Agent')
        });
      }
    });

    next();
  }

  // Track errors
  trackError(error, req) {
    this.metrics.errors++;
    logger.error('Application error', {
      error: error.message,
      stack: error.stack,
      method: req?.method,
      url: req?.url,
      userAgent: req?.get('User-Agent'),
      ip: req?.ip
    });
  }

  // Track WebSocket connections
  trackWebSocketConnection() {
    this.metrics.activeConnections++;
  }

  trackWebSocketDisconnection() {
    this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
  }

  // Get performance metrics
  getMetrics() {
    const avgResponseTime = this.metrics.responseTimes.length > 0
      ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
      : 0;

    const uptime = Date.now() - this.startTime;
    const memoryUsage = process.memoryUsage();

    return {
      uptime,
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0,
      avgResponseTime: Math.round(avgResponseTime),
      activeConnections: this.metrics.activeConnections,
      memoryUsage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) // MB
      }
    };
  }
}

// Security monitoring
class SecurityMonitor {
  constructor() {
    this.suspiciousActivities = [];
    this.blockedIPs = new Set();
    this.rateLimitViolations = new Map();
  }

  // Track suspicious activities
  trackSuspiciousActivity(activity) {
    this.suspiciousActivities.push({
      ...activity,
      timestamp: new Date().toISOString()
    });

    logger.warn('Suspicious activity detected', activity);

    // Keep only last 100 suspicious activities
    if (this.suspiciousActivities.length > 100) {
      this.suspiciousActivities.shift();
    }
  }

  // Track rate limit violations
  trackRateLimitViolation(ip) {
    const violations = this.rateLimitViolations.get(ip) || 0;
    this.rateLimitViolations.set(ip, violations + 1);

    if (violations >= 5) {
      this.blockedIPs.add(ip);
      logger.warn('IP blocked due to rate limit violations', { ip, violations });
    }
  }

  // Check if IP is blocked
  isIPBlocked(ip) {
    return this.blockedIPs.has(ip);
  }

  // Get security metrics
  getSecurityMetrics() {
    return {
      suspiciousActivities: this.suspiciousActivities.length,
      blockedIPs: this.blockedIPs.size,
      rateLimitViolations: Object.fromEntries(this.rateLimitViolations)
    };
  }
}

// Create monitoring instances
const performanceMonitor = new PerformanceMonitor();
const securityMonitor = new SecurityMonitor();

// Middleware for request tracking
export const requestTrackingMiddleware = (req, res, next) => {
  performanceMonitor.trackRequest(req, res, next);
};

// Middleware for security monitoring
export const securityMonitoringMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;

  // Check if IP is blocked
  if (securityMonitor.isIPBlocked(ip)) {
    logger.warn('Blocked IP attempted access', { ip, url: req.url });
    return res.status(403).json({ error: 'Access denied' });
  }

  // Track suspicious patterns
  const userAgent = req.get('User-Agent');
  if (userAgent && (userAgent.includes('bot') || userAgent.includes('crawler'))) {
    securityMonitor.trackSuspiciousActivity({
      type: 'bot_detected',
      ip,
      userAgent,
      url: req.url
    });
  }

  next();
};

// Error tracking middleware
export const errorTrackingMiddleware = (error, req, res, next) => {
  performanceMonitor.trackError(error, req);
  next(error);
};

// Health check endpoint
export const healthCheck = (req, res) => {
  const metrics = performanceMonitor.getMetrics();
  const securityMetrics = securityMonitor.getSecurityMetrics();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: metrics.uptime,
    performance: metrics,
    security: securityMetrics
  });
};

// Metrics endpoint
export const metricsEndpoint = (req, res) => {
  const metrics = performanceMonitor.getMetrics();
  const securityMetrics = securityMonitor.getSecurityMetrics();

  res.json({
    performance: metrics,
    security: securityMetrics
  });
};

// WebSocket monitoring
export const trackWebSocketConnection = () => {
  performanceMonitor.trackWebSocketConnection();
};

export const trackWebSocketDisconnection = () => {
  performanceMonitor.trackWebSocketDisconnection();
};

// Export logger and monitors
export { logger, performanceMonitor, securityMonitor };
