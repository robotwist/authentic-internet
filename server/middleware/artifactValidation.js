import Artifact from '../models/Artifact.js';

/**
 * Middleware to validate unified artifact data
 */
export const validateUnifiedArtifact = (req, res, next) => {
  try {
    const artifactData = req.body;
    const errors = [];

    // Check required fields
    if (!artifactData.name) {
      errors.push('Name is required');
    }
    if (!artifactData.description) {
      errors.push('Description is required');
    }
    if (!artifactData.type) {
      errors.push('Type is required');
    }
    if (!artifactData.content) {
      errors.push('Content is required');
    }
    if (!artifactData.area) {
      errors.push('Area is required');
    }

    // Validate location
    if (!artifactData.location) {
      errors.push('Location is required');
    } else {
      if (typeof artifactData.location.x !== 'number' || artifactData.location.x < 0) {
        errors.push('Location X coordinate must be a non-negative number');
      }
      if (typeof artifactData.location.y !== 'number' || artifactData.location.y < 0) {
        errors.push('Location Y coordinate must be a non-negative number');
      }
    }

    // Validate field lengths
    if (artifactData.name && artifactData.name.length > 100) {
      errors.push('Name cannot exceed 100 characters');
    }
    if (artifactData.description && artifactData.description.length > 500) {
      errors.push('Description cannot exceed 500 characters');
    }
    if (artifactData.content && artifactData.content.length > 5000) {
      errors.push('Content cannot exceed 5000 characters');
    }

    // Validate type enum
    const validTypes = [
      'artifact', 'WEAPON', 'SCROLL', 'ART', 'MUSIC', 'GAME', 'PUZZLE', 
      'STORY', 'TOOL', 'TREASURE', 'PORTAL', 'NPC', 'ENVIRONMENT'
    ];
    if (artifactData.type && !validTypes.includes(artifactData.type)) {
      errors.push(`Invalid artifact type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate area enum
    const validAreas = ['overworld', 'desert', 'dungeon', 'yosemite', 'custom'];
    if (artifactData.area && !validAreas.includes(artifactData.area)) {
      errors.push(`Invalid area. Must be one of: ${validAreas.join(', ')}`);
    }

    // Validate media array
    if (artifactData.media && Array.isArray(artifactData.media)) {
      if (artifactData.media.length > 10) {
        errors.push('Cannot have more than 10 media files');
      }
      // Validate each media URL
      artifactData.media.forEach((url, index) => {
        if (typeof url !== 'string' || url.length === 0) {
          errors.push(`Media URL at index ${index} must be a non-empty string`);
        }
      });
    }

    // Validate tags array
    if (artifactData.tags && Array.isArray(artifactData.tags)) {
      if (artifactData.tags.length > 20) {
        errors.push('Cannot have more than 20 tags');
      }
      // Validate each tag
      artifactData.tags.forEach((tag, index) => {
        if (typeof tag !== 'string' || tag.length === 0) {
          errors.push(`Tag at index ${index} must be a non-empty string`);
        }
        if (tag.length > 50) {
          errors.push(`Tag at index ${index} cannot exceed 50 characters`);
        }
      });
    }

    // Validate experience points
    if (artifactData.exp !== undefined) {
      const exp = Number(artifactData.exp);
      if (isNaN(exp) || exp < 0 || exp > 1000) {
        errors.push('Experience points must be a number between 0 and 1000');
      }
    }

    // Validate rating
    if (artifactData.rating !== undefined) {
      const rating = Number(artifactData.rating);
      if (isNaN(rating) || rating < 0 || rating > 5) {
        errors.push('Rating must be a number between 0 and 5');
      }
    }

    // Validate reviews array
    if (artifactData.reviews && Array.isArray(artifactData.reviews)) {
      artifactData.reviews.forEach((review, index) => {
        if (!review.userId) {
          errors.push(`Review at index ${index} must have a userId`);
        }
        if (review.rating === undefined || review.rating < 1 || review.rating > 5) {
          errors.push(`Review at index ${index} must have a rating between 1 and 5`);
        }
      });
    }

    // Validate legacy fields
    if (artifactData.messageText && artifactData.messageText.length > 1000) {
      errors.push('Message text cannot exceed 1000 characters');
    }
    if (artifactData.riddle && artifactData.riddle.length > 200) {
      errors.push('Riddle cannot exceed 200 characters');
    }
    if (artifactData.unlockAnswer && artifactData.unlockAnswer.length > 100) {
      errors.push('Unlock answer cannot exceed 100 characters');
    }
    if (artifactData.dedication && artifactData.dedication.length > 200) {
      errors.push('Dedication cannot exceed 200 characters');
    }
    if (artifactData.significance && artifactData.significance.length > 500) {
      errors.push('Significance cannot exceed 500 characters');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

    // Add creator information if not present
    if (!artifactData.createdBy && req.user) {
      artifactData.createdBy = req.user.userId || req.user.id;
    }

    // Set timestamps
    if (!artifactData.createdAt) {
      artifactData.createdAt = new Date();
    }
    artifactData.updatedAt = new Date();

    next();
  } catch (error) {
    console.error('Artifact validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Validation error occurred',
      error: error.message
    });
  }
};

/**
 * Middleware to validate artifact updates
 */
export const validateArtifactUpdate = (req, res, next) => {
  try {
    const updateData = req.body;
    const errors = [];

    // For updates, only validate fields that are being updated
    if (updateData.name !== undefined) {
      if (!updateData.name) {
        errors.push('Name cannot be empty');
      } else if (updateData.name.length > 100) {
        errors.push('Name cannot exceed 100 characters');
      }
    }

    if (updateData.description !== undefined) {
      if (!updateData.description) {
        errors.push('Description cannot be empty');
      } else if (updateData.description.length > 500) {
        errors.push('Description cannot exceed 500 characters');
      }
    }

    if (updateData.content !== undefined) {
      if (!updateData.content) {
        errors.push('Content cannot be empty');
      } else if (updateData.content.length > 5000) {
        errors.push('Content cannot exceed 5000 characters');
      }
    }

    if (updateData.type !== undefined) {
      const validTypes = [
        'artifact', 'WEAPON', 'SCROLL', 'ART', 'MUSIC', 'GAME', 'PUZZLE', 
        'STORY', 'TOOL', 'TREASURE', 'PORTAL', 'NPC', 'ENVIRONMENT'
      ];
      if (!validTypes.includes(updateData.type)) {
        errors.push(`Invalid artifact type. Must be one of: ${validTypes.join(', ')}`);
      }
    }

    if (updateData.area !== undefined) {
      const validAreas = ['overworld', 'desert', 'dungeon', 'yosemite', 'custom'];
      if (!validAreas.includes(updateData.area)) {
        errors.push(`Invalid area. Must be one of: ${validAreas.join(', ')}`);
      }
    }

    if (updateData.location !== undefined) {
      if (!updateData.location) {
        errors.push('Location cannot be empty');
      } else {
        if (typeof updateData.location.x !== 'number' || updateData.location.x < 0) {
          errors.push('Location X coordinate must be a non-negative number');
        }
        if (typeof updateData.location.y !== 'number' || updateData.location.y < 0) {
          errors.push('Location Y coordinate must be a non-negative number');
        }
      }
    }

    if (updateData.media !== undefined && Array.isArray(updateData.media)) {
      if (updateData.media.length > 10) {
        errors.push('Cannot have more than 10 media files');
      }
    }

    if (updateData.tags !== undefined && Array.isArray(updateData.tags)) {
      if (updateData.tags.length > 20) {
        errors.push('Cannot have more than 20 tags');
      }
    }

    if (updateData.exp !== undefined) {
      const exp = Number(updateData.exp);
      if (isNaN(exp) || exp < 0 || exp > 1000) {
        errors.push('Experience points must be a number between 0 and 1000');
      }
    }

    if (updateData.rating !== undefined) {
      const rating = Number(updateData.rating);
      if (isNaN(rating) || rating < 0 || rating > 5) {
        errors.push('Rating must be a number between 0 and 5');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Update validation failed',
        errors: errors
      });
    }

    // Set updated timestamp
    updateData.updatedAt = new Date();

    next();
  } catch (error) {
    console.error('Artifact update validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Update validation error occurred',
      error: error.message
    });
  }
};

/**
 * Middleware to convert legacy artifact data to unified format
 */
export const convertLegacyArtifact = (req, res, next) => {
  try {
    const artifactData = req.body;

    // Convert legacy x/y coordinates to location object
    if (artifactData.x !== undefined && artifactData.y !== undefined && !artifactData.location) {
      artifactData.location = {
        x: Number(artifactData.x),
        y: Number(artifactData.y),
        mapName: artifactData.area || 'overworld'
      };
      delete artifactData.x;
      delete artifactData.y;
    }

    // Convert legacy creator field
    if (artifactData.creator && !artifactData.createdBy) {
      artifactData.createdBy = artifactData.creator;
    }

    // Set default type if not provided
    if (!artifactData.type) {
      artifactData.type = 'artifact';
    }

    // Set default experience if not provided
    if (artifactData.exp === undefined) {
      artifactData.exp = 10;
    }

    // Ensure arrays are properly initialized
    if (!artifactData.media) artifactData.media = [];
    if (!artifactData.tags) artifactData.tags = [];
    if (!artifactData.reviews) artifactData.reviews = [];

    next();
  } catch (error) {
    console.error('Legacy conversion error:', error);
    res.status(500).json({
      success: false,
      message: 'Legacy conversion error occurred',
      error: error.message
    });
  }
};

/**
 * Middleware to ensure response format is unified
 */
export const ensureUnifiedResponse = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // If this is an artifact response, ensure it's in unified format
    if (data && (data.artifact || (Array.isArray(data) && data.length > 0 && data[0]._id))) {
      if (data.artifact) {
        // Single artifact response
        data.artifact = data.artifact.toUnifiedFormat ? data.artifact.toUnifiedFormat() : data.artifact;
      } else if (Array.isArray(data)) {
        // Array of artifacts response
        data = data.map(artifact => 
          artifact.toUnifiedFormat ? artifact.toUnifiedFormat() : artifact
        );
      }
    }
    
    return originalJson.call(this, data);
  };
  
  next();
}; 