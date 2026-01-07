/**
 * Unified Artifact Model for Authentic Internet
 * Supports all creative content types: games, stories, art, music, puzzles, etc.
 */

/**
 * @typedef {Object} ArtifactInteraction
 * @property {string} type - Type of interaction (REVEAL, UNLOCK, COLLECT, SOLVE, CUSTOM)
 * @property {string} [condition] - Condition for the interaction
 * @property {string} [revealedContent] - Content revealed by the interaction
 * @property {string} [action] - Action performed
 */

/**
 * @typedef {Object} Review
 * @property {string} userId
 * @property {number} rating
 * @property {string} comment
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Artifact
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} type
 * @property {string} content
 * @property {string[]} [media]
 * @property {{x: number, y: number, mapName?: string}} location
 * @property {number} exp
 * @property {boolean} visible
 * @property {string} area
 * @property {ArtifactInteraction[]} [interactions]
 * @property {Object} [properties]
 * @property {Object} [userModifiable]
 * @property {string} [createdBy]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 * @property {string[]} [tags]
 * @property {number} [rating]
 * @property {Review[]} [reviews]
 * @property {string} [remixOf]
 */

// Example export for use in PropTypes or TypeScript
export const ArtifactModel = {};
