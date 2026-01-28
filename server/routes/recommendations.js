import express from 'express';
import auth from '../middleware/authMiddleware.js';
import Artifact from '../models/Artifact.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * Recommendation Engine API
 * Provides AI-powered content recommendations using multiple algorithms
 */

// User behavior tracking
const userBehaviorStore = new Map();

// Track user interaction
const trackUserInteraction = (userId, interaction) => {
  if (!userBehaviorStore.has(userId)) {
    userBehaviorStore.set(userId, {
      interactions: [],
      preferences: {},
      lastUpdated: Date.now()
    });
  }

  const userData = userBehaviorStore.get(userId);
  userData.interactions.push({
    ...interaction,
    timestamp: Date.now()
  });

  // Update preferences based on interaction
  updateUserPreferences(userId, interaction);
  
  userBehaviorStore.set(userId, userData);
};

// Completion counts as strong positive signal for preferences
const isPositiveSignal = (interaction) =>
  interaction.feedback === 'positive' || interaction.type === 'complete';
const isNegativeSignal = (interaction) =>
  interaction.feedback === 'negative' && interaction.type !== 'complete';

// Update user preferences based on interactions
const updateUserPreferences = (userId, interaction) => {
  const userData = userBehaviorStore.get(userId);
  if (!userData) return;

  const { artifactId, type, feedback } = interaction;
  
  // Get artifact data
  Artifact.findById(artifactId).then(artifact => {
    if (!artifact) return;

    const preferences = userData.preferences;
    const positive = isPositiveSignal({ type, feedback });
    const negative = isNegativeSignal({ type, feedback });

    // Update type preferences
    if (artifact.type) {
      preferences.types = preferences.types || {};
      if (positive) {
        preferences.types[artifact.type] = (preferences.types[artifact.type] || 0) + (type === 'complete' ? 1.5 : 1);
      } else if (negative) {
        preferences.types[artifact.type] = Math.max(0, (preferences.types[artifact.type] || 0) - 0.5);
      }
    }

    // Update area preferences
    if (artifact.area) {
      preferences.areas = preferences.areas || {};
      if (positive) {
        preferences.areas[artifact.area] = (preferences.areas[artifact.area] || 0) + (type === 'complete' ? 1.5 : 1);
      } else if (negative) {
        preferences.areas[artifact.area] = Math.max(0, (preferences.areas[artifact.area] || 0) - 0.5);
      }
    }

    // Update creator preferences
    if (artifact.createdBy) {
      preferences.creators = preferences.creators || {};
      if (positive) {
        preferences.creators[artifact.createdBy] = (preferences.creators[artifact.createdBy] || 0) + (type === 'complete' ? 1.5 : 1);
      } else if (negative) {
        preferences.creators[artifact.createdBy] = Math.max(0, (preferences.creators[artifact.createdBy] || 0) - 0.5);
      }
    }

    // Update tag preferences
    if (artifact.tags && artifact.tags.length > 0) {
      preferences.tags = preferences.tags || {};
      artifact.tags.forEach(tag => {
        if (positive) {
          preferences.tags[tag] = (preferences.tags[tag] || 0) + (type === 'complete' ? 1.5 : 1);
        } else if (negative) {
          preferences.tags[tag] = Math.max(0, (preferences.tags[tag] || 0) - 0.5);
        }
      });
    }

    userData.preferences = preferences;
    userData.lastUpdated = Date.now();
    userBehaviorStore.set(userId, userData);
  });
};

// Get set of completed artifact IDs for a user
const getCompletedArtifactIds = (userData) => {
  if (!userData?.interactions?.length) return new Set();
  return new Set(
    userData.interactions
      .filter((i) => i.type === 'complete')
      .map((i) => (i.artifactId != null ? String(i.artifactId) : ''))
      .filter(Boolean)
  );
};

// Collaborative filtering algorithm
const collaborativeFiltering = async (userId, artifacts) => {
  try {
    const userData = userBehaviorStore.get(userId);
    if (!userData || userData.interactions.length === 0) {
      return [];
    }

    const completedIds = getCompletedArtifactIds(userData);
    const similarUsers = findSimilarUsers(userId, userData);
    const recommendedArtifacts = [];

    for (const similarUserId of similarUsers) {
      const similarUserData = userBehaviorStore.get(similarUserId);
      if (!similarUserData) continue;

      const positiveInteractions = similarUserData.interactions.filter(
        (i) => i.feedback === 'positive'
      );

      for (const interaction of positiveInteractions) {
        const aid = (interaction.artifactId || interaction.artifactId?.toString?.())?.toString?.();
        if (completedIds.has(aid)) continue;
        const artifact = artifacts.find((a) => (a._id || a.id)?.toString?.() === aid);
        if (
          artifact &&
          !recommendedArtifacts.some(
            (r) => (r._id || r.id)?.toString?.() === (artifact._id || artifact.id)?.toString?.()
          )
        ) {
          recommendedArtifacts.push({
            ...(typeof artifact.toObject === 'function' ? artifact.toObject() : artifact),
            score: calculateCollaborativeScore(interaction, similarUserData),
            algorithm: 'collaborative'
          });
        }
      }
    }

    return recommendedArtifacts
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  } catch (error) {
    console.error('Collaborative filtering error:', error);
    return [];
  }
};

// Find users with similar preferences
const findSimilarUsers = (userId, userData) => {
  const similarUsers = [];
  const userPreferences = userData.preferences;

  for (const [otherUserId, otherUserData] of userBehaviorStore.entries()) {
    if (otherUserId === userId) continue;

    const similarity = calculateUserSimilarity(userPreferences, otherUserData.preferences);
    if (similarity > 0.3) {
      similarUsers.push(otherUserId);
    }
  }

  return similarUsers.slice(0, 10); // Limit to top 10 similar users
};

// Calculate similarity between users
const calculateUserSimilarity = (prefs1, prefs2) => {
  const allTypes = new Set([...Object.keys(prefs1.types || {}), ...Object.keys(prefs2.types || {})]);
  const allAreas = new Set([...Object.keys(prefs1.areas || {}), ...Object.keys(prefs2.areas || {})]);
  const allCreators = new Set([...Object.keys(prefs1.creators || {}), ...Object.keys(prefs2.creators || {})]);

  let typeSimilarity = 0;
  let areaSimilarity = 0;
  let creatorSimilarity = 0;

  // Calculate type similarity
  allTypes.forEach(type => {
    const val1 = prefs1.types?.[type] || 0;
    const val2 = prefs2.types?.[type] || 0;
    typeSimilarity += Math.min(val1, val2);
  });

  // Calculate area similarity
  allAreas.forEach(area => {
    const val1 = prefs1.areas?.[area] || 0;
    const val2 = prefs2.areas?.[area] || 0;
    areaSimilarity += Math.min(val1, val2);
  });

  // Calculate creator similarity
  allCreators.forEach(creator => {
    const val1 = prefs1.creators?.[creator] || 0;
    const val2 = prefs2.creators?.[creator] || 0;
    creatorSimilarity += Math.min(val1, val2);
  });

  const totalSimilarity = (typeSimilarity + areaSimilarity + creatorSimilarity) / 3;
  return totalSimilarity;
};

// Calculate collaborative filtering score
const calculateCollaborativeScore = (interaction, userData) => {
  let score = 0;

  // Base score from interaction
  if (interaction.feedback === 'positive') {
    score += 10;
  } else if (interaction.feedback === 'negative') {
    score += 2;
  }

  // Recency bonus
  const daysSinceInteraction = (Date.now() - interaction.timestamp) / (1000 * 60 * 60 * 24);
  if (daysSinceInteraction <= 7) {
    score += 5;
  } else if (daysSinceInteraction <= 30) {
    score += 2;
  }

  // User activity bonus
  const userActivity = userData.interactions.length;
  if (userActivity > 50) {
    score += 3;
  } else if (userActivity > 20) {
    score += 2;
  }

  return score;
};

// Content-based filtering algorithm
const contentBasedFiltering = async (userId, artifacts) => {
  try {
    const userData = userBehaviorStore.get(userId);
    const completedIds = getCompletedArtifactIds(userData || {});
    const completedArtifacts = artifacts.filter((a) =>
      completedIds.has((a._id || a.id)?.toString?.())
    );
    const completedTypes = new Set(completedArtifacts.map((a) => a.type).filter(Boolean));
    const completedAreas = new Set(completedArtifacts.map((a) => a.area).filter(Boolean));
    const completedTags = new Set(completedArtifacts.flatMap((a) => a.tags || []).filter(Boolean));

    const preferences = userData?.preferences || {};
    const scoredArtifacts = [];

    for (const artifact of artifacts) {
      const aid = (artifact._id || artifact.id)?.toString?.();
      if (completedIds.has(aid)) continue;

      let score = 0;

      // Type preference
      if (artifact.type && preferences.types?.[artifact.type]) {
        score += preferences.types[artifact.type] * 10;
      }

      // Area preference
      if (artifact.area && preferences.areas?.[artifact.area]) {
        score += preferences.areas[artifact.area] * 8;
      }

      // Creator preference
      if (artifact.createdBy && preferences.creators?.[artifact.createdBy]) {
        score += preferences.creators[artifact.createdBy] * 15;
      }

      // Tag preferences
      if (artifact.tags && preferences.tags) {
        artifact.tags.forEach((tag) => {
          if (preferences.tags[tag]) score += preferences.tags[tag] * 5;
        });
      }

      // Completion-history boost: same type/area/tags as completed
      if (completedArtifacts.length > 0) {
        if (artifact.type && completedTypes.has(artifact.type)) score += 12;
        if (artifact.area && completedAreas.has(artifact.area)) score += 10;
        if (artifact.tags?.length) {
          const matchCount = artifact.tags.filter((t) => completedTags.has(t)).length;
          if (matchCount > 0) score += matchCount * 6;
        }
      }

      // Content quality indicators
      if (artifact.rating && artifact.rating >= 4) score += 20;
      if (artifact.reviews && artifact.reviews.length >= 5) score += 15;
      if (artifact.media && artifact.media.length > 0) score += 10;

      if (score > 0) {
        scoredArtifacts.push({
          ...(typeof artifact.toObject === 'function' ? artifact.toObject() : artifact),
          score,
          algorithm: 'content-based'
        });
      }
    }

    return scoredArtifacts
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  } catch (error) {
    console.error('Content-based filtering error:', error);
    return [];
  }
};

// Contextual filtering algorithm
const contextualFiltering = async (userId, artifacts) => {
  try {
    const userData = userBehaviorStore.get(userId);
    if (!userData) return [];
    const completedIds = getCompletedArtifactIds(userData);

    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const scoredArtifacts = [];

    for (const artifact of artifacts) {
      if (completedIds.has((artifact._id || artifact.id)?.toString?.())) continue;
      let score = 0;

      // Time-based recommendations
      if (hour >= 6 && hour <= 12) {
        // Morning - prefer educational/productive content
        if (artifact.type === 'story' || artifact.type === 'puzzle') {
          score += 15;
        }
      } else if (hour >= 18 && hour <= 22) {
        // Evening - prefer entertainment content
        if (artifact.type === 'game' || artifact.type === 'music') {
          score += 15;
        }
      }

      // Session-based recommendations
      const recentInteractions = userData.interactions.filter(
        interaction => Date.now() - interaction.timestamp < 30 * 60 * 1000 // Last 30 minutes
      );

      if (recentInteractions.length > 10) {
        // Long session - suggest shorter content
        if (artifact.exp <= 20) {
          score += 10;
        }
      } else {
        // Short session - suggest engaging content
        if (artifact.rating >= 4) {
          score += 15;
        }
      }

      // Recency bonus
      const createdAt = new Date(artifact.createdAt);
      const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation <= 7) {
        score += 20;
      } else if (daysSinceCreation <= 30) {
        score += 10;
      }

      if (score > 0) {
        scoredArtifacts.push({
          ...artifact.toObject(),
          score,
          algorithm: 'contextual'
        });
      }
    }

    return scoredArtifacts
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  } catch (error) {
    console.error('Contextual filtering error:', error);
    return [];
  }
};

// Serendipity algorithm
const serendipityFiltering = async (userId, artifacts) => {
  try {
    const userData = userBehaviorStore.get(userId);
    if (!userData) return [];

    const completedIds = getCompletedArtifactIds(userData);
    const viewedArtifacts = new Set(
      userData.interactions
        .filter((i) => i.type === 'view')
        .map((i) => (i.artifactId || i.artifactId?.toString?.())?.toString?.())
    );
    const viewedTypes = new Set();
    const viewedCreators = new Set();
    userData.interactions
      .filter((i) => i.type === 'view')
      .forEach((i) => {
        const a = artifacts.find(
          (x) => (x._id || x.id)?.toString?.() === (i.artifactId || i.artifactId?.toString?.())?.toString?.()
        );
        if (a?.type) viewedTypes.add(a.type);
        if (a?.createdBy) viewedCreators.add(a.createdBy);
      });

    const scoredArtifacts = [];

    for (const artifact of artifacts) {
      const aid = (artifact._id || artifact.id)?.toString?.();
      if (completedIds.has(aid)) continue;
      let score = 0;

      // Reward new content types
      if (!viewedTypes.has(artifact.type)) {
        score += 30;
      }

      // Reward high-quality but less popular content
      if (artifact.rating >= 4 && (artifact.viewCount || 0) < 100) {
        score += 20;
      }

      // Reward diverse creators
      if (!viewedCreators.has(artifact.createdBy)) {
        score += 15;
      }

      // Reward unseen artifacts
      if (!viewedArtifacts.has(aid)) {
        score += 25;
      }

      // Add randomness for serendipity
      score += Math.random() * 10;

      if (score > 0) {
        scoredArtifacts.push({
          ...(typeof artifact.toObject === 'function' ? artifact.toObject() : artifact),
          score,
          algorithm: 'serendipity'
        });
      }
    }

    return scoredArtifacts
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  } catch (error) {
    console.error('Serendipity filtering error:', error);
    return [];
  }
};

// Hybrid algorithm - combine multiple algorithms
const hybridFiltering = async (userId, artifacts) => {
  try {
    const algorithms = [
      { name: 'collaborative', weight: 0.3 },
      { name: 'contentBased', weight: 0.4 },
      { name: 'contextual', weight: 0.2 },
      { name: 'serendipity', weight: 0.1 }
    ];

    const algorithmResults = await Promise.all([
      collaborativeFiltering(userId, artifacts),
      contentBasedFiltering(userId, artifacts),
      contextualFiltering(userId, artifacts),
      serendipityFiltering(userId, artifacts)
    ]);

    // Combine results with weights
    const combinedScores = new Map();
    
    algorithmResults.forEach((results, index) => {
      const weight = algorithms[index].weight;
      results.forEach(artifact => {
        const artifactId = artifact._id.toString();
        if (!combinedScores.has(artifactId)) {
          combinedScores.set(artifactId, {
            artifact,
            score: 0,
            algorithms: []
          });
        }
        
        const existing = combinedScores.get(artifactId);
        existing.score += artifact.score * weight;
        existing.algorithms.push(algorithms[index].name);
        combinedScores.set(artifactId, existing);
      });
    });

    const finalResults = Array.from(combinedScores.values())
      .map(item => ({
        ...item.artifact,
        score: item.score,
        algorithm: 'hybrid',
        contributingAlgorithms: item.algorithms
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    return finalResults;
  } catch (error) {
    console.error('Hybrid filtering error:', error);
    return [];
  }
};

// API Routes

// Get recommendations
router.get('/', auth, async (req, res) => {
  try {
    const { algorithm = 'hybrid', limit = 12, diversity = 0.5, novelty = 0.3 } = req.query;
    const userId = req.user.id;

    // Get all artifacts
    const artifacts = await Artifact.find({ visible: true }).populate('createdBy', 'username');

    let recommendations = [];

    // Generate recommendations based on algorithm
    switch (algorithm) {
      case 'collaborative':
        recommendations = await collaborativeFiltering(userId, artifacts);
        break;
      case 'contentBased':
        recommendations = await contentBasedFiltering(userId, artifacts);
        break;
      case 'contextual':
        recommendations = await contextualFiltering(userId, artifacts);
        break;
      case 'serendipity':
        recommendations = await serendipityFiltering(userId, artifacts);
        break;
      case 'hybrid':
      default:
        recommendations = await hybridFiltering(userId, artifacts);
        break;
    }

    // Apply diversity filter
    if (diversity > 0) {
      recommendations = applyDiversityFilter(recommendations, parseFloat(diversity));
    }

    // Apply novelty filter
    if (novelty > 0) {
      recommendations = applyNoveltyFilter(recommendations, parseFloat(novelty), userId);
    }

    // Limit results
    recommendations = recommendations.slice(0, parseInt(limit));

    res.json({
      success: true,
      recommendations,
      algorithm,
      totalResults: recommendations.length,
      userConfidence: getUserConfidence(userId)
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: error.message
    });
  }
});

// Track user interaction
router.post('/interaction', auth, async (req, res) => {
  try {
    const { artifactId, type, feedback, algorithm } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!artifactId || !type) {
      return res.status(400).json({
        success: false,
        message: 'artifactId and type are required'
      });
    }

    // Track the interaction
    trackUserInteraction(userId, {
      artifactId,
      type,
      feedback,
      algorithm,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      message: 'Interaction tracked successfully'
    });
  } catch (error) {
    console.error('Interaction tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track interaction',
      error: error.message
    });
  }
});

// Get user profile and preferences
router.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userData = userBehaviorStore.get(userId);

    if (!userData) {
      return res.json({
        success: true,
        profile: {
          id: userId,
          preferences: {},
          behavior: {},
          learning: {
            totalInteractions: 0,
            confidence: 0.1,
            lastUpdated: Date.now()
          }
        }
      });
    }

    const profile = {
      id: userId,
      preferences: userData.preferences,
      behavior: analyzeUserBehavior(userData),
      learning: {
        totalInteractions: userData.interactions.length,
        confidence: calculateUserConfidence(userData),
        lastUpdated: userData.lastUpdated
      }
    };

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
});

// Get recommendation insights
router.get('/insights', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userData = userBehaviorStore.get(userId);

    if (!userData) {
      return res.json({
        success: true,
        insights: {
          totalInteractions: 0,
          favoriteTypes: [],
          favoriteAreas: [],
          favoriteCreators: [],
          interactionTrends: [],
          recommendationsAccuracy: 0
        }
      });
    }

    const insights = {
      totalInteractions: userData.interactions.length,
      favoriteTypes: getTopPreferences(userData.preferences.types || {}),
      favoriteAreas: getTopPreferences(userData.preferences.areas || {}),
      favoriteCreators: getTopPreferences(userData.preferences.creators || {}),
      interactionTrends: analyzeInteractionTrends(userData.interactions),
      recommendationsAccuracy: calculateRecommendationAccuracy(userData)
    };

    res.json({
      success: true,
      insights
    });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get insights',
      error: error.message
    });
  }
});

// Helper functions

// Apply diversity filter
const applyDiversityFilter = (recommendations, diversityLevel) => {
  if (diversityLevel === 0) return recommendations;

  const filtered = [];
  const usedTypes = new Set();
  const usedCreators = new Set();

  recommendations.forEach(artifact => {
    const type = artifact.type;
    const creator = artifact.createdBy;
    
    const typeDiversity = usedTypes.has(type) ? 0 : 1;
    const creatorDiversity = usedCreators.has(creator) ? 0 : 1;
    
    const diversityScore = (typeDiversity + creatorDiversity) / 2;
    
    if (diversityScore >= diversityLevel || Math.random() < 0.3) {
      filtered.push(artifact);
      usedTypes.add(type);
      usedCreators.add(creator);
    }
  });

  return filtered;
};

// Apply novelty filter
const applyNoveltyFilter = (recommendations, noveltyLevel, userId) => {
  if (noveltyLevel === 0) return recommendations;

  const userData = userBehaviorStore.get(userId);
  if (!userData) return recommendations;

  const viewedArtifacts = new Set(
    userData.interactions
      .filter(interaction => interaction.type === 'view')
      .map(interaction => interaction.artifactId)
  );

  return recommendations.filter(artifact => {
    const isNovel = !viewedArtifacts.has(artifact._id.toString());
    return isNovel || Math.random() < noveltyLevel;
  });
};

// Get user confidence level
const getUserConfidence = (userId) => {
  const userData = userBehaviorStore.get(userId);
  if (!userData) return 0.1;

  return calculateUserConfidence(userData);
};

// Calculate user confidence based on interaction history
const calculateUserConfidence = (userData) => {
  const totalInteractions = userData.interactions.length;
  const positiveInteractions = userData.interactions.filter(
    interaction => interaction.feedback === 'positive'
  ).length;

  if (totalInteractions === 0) return 0.1;

  const positiveRatio = positiveInteractions / totalInteractions;
  const interactionVolume = Math.min(totalInteractions / 100, 1); // Normalize to 0-1

  return Math.min(1, (positiveRatio * 0.7) + (interactionVolume * 0.3));
};

// Analyze user behavior
const analyzeUserBehavior = (userData) => {
  const interactions = userData.interactions;
  
  return {
    explorationTendency: calculateExplorationTendency(interactions),
    completionRate: calculateCompletionRate(interactions),
    socialEngagement: calculateSocialEngagement(interactions),
    creativityLevel: calculateCreativityLevel(interactions)
  };
};

// Calculate exploration tendency
const calculateExplorationTendency = (interactions) => {
  const uniqueTypes = new Set();
  const uniqueCreators = new Set();
  
  interactions.forEach(interaction => {
    // This would require artifact data, simplified for now
    uniqueTypes.add(interaction.type || 'unknown');
    uniqueCreators.add(interaction.creator || 'unknown');
  });

  const diversity = (uniqueTypes.size + uniqueCreators.size) / (interactions.length * 2);
  return Math.min(1, diversity);
};

// Calculate completion rate
const calculateCompletionRate = (interactions) => {
  const completed = interactions.filter(interaction => 
    interaction.type === 'complete' || interaction.feedback === 'positive'
  ).length;
  
  return interactions.length > 0 ? completed / interactions.length : 0;
};

// Calculate social engagement
const calculateSocialEngagement = (interactions) => {
  const socialInteractions = interactions.filter(interaction =>
    interaction.type === 'comment' || interaction.type === 'share' || interaction.type === 'rate'
  ).length;
  
  return interactions.length > 0 ? socialInteractions / interactions.length : 0;
};

// Calculate creativity level
const calculateCreativityLevel = (interactions) => {
  const creativeInteractions = interactions.filter(interaction =>
    interaction.type === 'create' || interaction.type === 'remix'
  ).length;
  
  return interactions.length > 0 ? creativeInteractions / interactions.length : 0;
};

// Get top preferences
const getTopPreferences = (preferences) => {
  return Object.entries(preferences)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([key, value]) => ({ key, value }));
};

// Analyze interaction trends
const analyzeInteractionTrends = (interactions) => {
  const now = Date.now();
  const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

  const recentInteractions = interactions.filter(i => i.timestamp > oneWeekAgo);
  const monthlyInteractions = interactions.filter(i => i.timestamp > oneMonthAgo);

  return {
    dailyAverage: recentInteractions.length / 7,
    weeklyTotal: recentInteractions.length,
    monthlyTotal: monthlyInteractions.length,
    trend: recentInteractions.length > (monthlyInteractions.length / 4) ? 'increasing' : 'decreasing'
  };
};

// Calculate recommendation accuracy
const calculateRecommendationAccuracy = (userData) => {
  const feedbackInteractions = userData.interactions.filter(i => i.feedback);
  if (feedbackInteractions.length === 0) return 0;

  const positiveFeedback = feedbackInteractions.filter(i => i.feedback === 'positive').length;
  return positiveFeedback / feedbackInteractions.length;
};

export default router; 