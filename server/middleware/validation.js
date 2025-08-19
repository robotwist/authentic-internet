import Joi from 'joi';

// Validation schemas
const userValidation = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])')).required()
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  updateProfile: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).optional(),
    avatar: Joi.string().uri().optional(),
    bio: Joi.string().max(500).optional()
  })
};

const artifactValidation = {
  create: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(1000).optional(),
    type: Joi.string().valid('game', 'writing', 'art', 'music').required(),
    content: Joi.object().required(),
    visibility: Joi.string().valid('public', 'private', 'unlisted').default('private'),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional()
  }),
  
  update: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().max(1000).optional(),
    content: Joi.object().optional(),
    visibility: Joi.string().valid('public', 'private', 'unlisted').optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional()
  }),
  
  share: Joi.object({
    price: Joi.number().min(0).max(10000).optional(),
    category: Joi.string().valid('new', 'featured', 'trending', 'popular').optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    description: Joi.string().max(500).optional()
  })
};

const friendValidation = {
  request: Joi.object({
    targetUserId: Joi.string().hex().length(24).required()
  }),
  
  accept: Joi.object({
    fromUserId: Joi.string().hex().length(24).required()
  }),
  
  decline: Joi.object({
    fromUserId: Joi.string().hex().length(24).required()
  })
};

const worldValidation = {
  join: Joi.object({
    worldId: Joi.string().min(1).max(100).required(),
    worldName: Joi.string().min(1).max(100).optional(),
    position: Joi.object({
      x: Joi.number().required(),
      y: Joi.number().required(),
      z: Joi.number().optional()
    }).optional()
  }),
  
  message: Joi.object({
    content: Joi.string().min(1).max(1000).required(),
    worldId: Joi.string().min(1).max(100).required()
  }),
  
  position: Joi.object({
    worldId: Joi.string().min(1).max(100).required(),
    position: Joi.object({
      x: Joi.number().required(),
      y: Joi.number().required(),
      z: Joi.number().optional()
    }).required(),
    facing: Joi.string().valid('up', 'down', 'left', 'right').optional()
  })
};

// Validation middleware
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req[property] = value;
    next();
  };
};

// Rate limiting middleware
export const rateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    if (requests.has(ip)) {
      requests.set(ip, requests.get(ip).filter(timestamp => timestamp > windowStart));
    }
    
    const requestCount = requests.get(ip)?.length || 0;
    
    if (requestCount >= max) {
      return res.status(429).json({
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    requests.get(ip).push(now);
    
    next();
  };
};

// XSS protection middleware
export const xssProtection = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    const sanitize = (obj) => {
      for (let key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key]
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };
    sanitize(req.body);
  }
  
  // Set security headers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  
  next();
};

// Export validation schemas
export const schemas = {
  user: userValidation,
  artifact: artifactValidation,
  friend: friendValidation,
  world: worldValidation
};
