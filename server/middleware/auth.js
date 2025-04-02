import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to the request
 */
export const auth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required. Please login.' 
      });
    }

    // Ensure JWT secret is set
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      return res.status(500).json({ 
        success: false,
        message: 'Server configuration error' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token format' 
      });
    }

    // Check if user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Check if user is active
    if (user.accountStatus !== 'active') {
      return res.status(403).json({ 
        success: false,
        message: `Your account is ${user.accountStatus}` 
      });
    }

    // Attach user data to request object
    req.user = decoded;
    req.userId = decoded.userId;
    req.userRole = decoded.role || 'user';
    
    // Continue to next middleware or route handler
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token has expired',
        tokenExpired: true
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token'
      });
    }
    
    res.status(401).json({ 
      success: false,
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Role-based access control middleware
 * Checks if user has required role(s)
 * @param {Array|String} roles - Required role(s) for access
 */
export const checkRole = (roles) => {
  return (req, res, next) => {
    // Auth middleware must be used before this middleware
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }
    
    // Convert single role to array
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    // Check if user has any of the required roles
    if (!requiredRoles.includes(req.userRole)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied: insufficient permissions' 
      });
    }
    
    // User has required role, proceed
    next();
  };
};

/**
 * Activity tracking middleware
 * Updates user's lastActive timestamp
 */
export const trackActivity = async (req, res, next) => {
  try {
    // Only track for authenticated requests
    if (req.userId) {
      // Update lastActive in background without affecting response time
      User.findByIdAndUpdate(
        req.userId, 
        { lastActive: new Date() },
        { new: false } // Don't wait for updated document
      ).catch(err => console.error('Error updating activity:', err));
    }
    
    // Always continue to next middleware
    next();
  } catch (error) {
    // Log but don't block the request
    console.error('Activity tracking error:', error);
    next();
  }
}; 