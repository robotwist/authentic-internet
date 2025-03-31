/**
 * DEPRECATED: This file is kept for backward compatibility
 * All functionality has been moved to /utils/quoteSystem.js
 */

import { getRandomQuote, getCategoryQuote } from '../utils/quoteSystem.js';

// Export the same functions but redirect to quoteSystem
export const getWisdomQuote = () => getCategoryQuote('wisdom');
export const getZenQuote = () => getCategoryQuote('wisdom');
export const getRandomWisdomQuote = () => getCategoryQuote('wisdom');
export const getHemingwayQuote = () => getCategoryQuote('literary');
export const getShakespeareQuote = () => getCategoryQuote('literary');
export const getNatureQuote = () => getCategoryQuote('nature');
export const getInspirationQuote = () => getCategoryQuote('inspiration');

// Main fallback that uses the new system
export { getRandomQuote };

// Log a console warning about using deprecated APIs
console.warn('externalApis.js is deprecated and will be removed in a future release. Please use utils/quoteSystem.js instead.'); 