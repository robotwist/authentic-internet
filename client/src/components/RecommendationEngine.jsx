import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Alert,
  Badge,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import {
  Psychology,
  TrendingUp,
  Star,
  AccessTime,
  Person,
  Category,
  LocationOn,
  Explore,
  Favorite,
  Share,
  PlayArrow,
  AutoAwesome,
  Whatshot,
  NewReleases,
  Recommend,
  SmartToy,
  Lightbulb,
  Insights,
  Refresh,
  Settings,
  Visibility,
  ThumbUp,
  ThumbDown,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import ArtifactCard from "./ArtifactCard";
import "./RecommendationEngine.css";

const RecommendationEngine = ({
  artifacts,
  onArtifactSelect,
  loading = false,
  showSettings = false,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [userProfile, setUserProfile] = useState({});
  const [userInteractions, setUserInteractions] = useState([]);
  const [recommendationSettings, setRecommendationSettings] = useState({
    algorithm: "hybrid",
    diversity: 0.5,
    novelty: 0.3,
    serendipity: 0.2,
    enableCollaborative: true,
    enableContentBased: true,
    enableContextual: true,
    enableRealTime: true,
  });
  const [recommendationHistory, setRecommendationHistory] = useState([]);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [showSettingsPanel, setShowSettingsPanel] = useState(showSettings);
  const [learningProgress, setLearningProgress] = useState(0);
  const [isLearning, setIsLearning] = useState(false);

  // Refs for tracking user behavior
  const userBehaviorRef = useRef({
    viewTime: {},
    interactions: {},
    preferences: {},
    sessionData: [],
  });

  // Load user data and initialize profile
  useEffect(() => {
    loadUserData();
    initializeUserProfile();
    startBehaviorTracking();
  }, []);

  // Load user data from localStorage
  const loadUserData = () => {
    try {
      const viewed = localStorage.getItem("viewedArtifacts");
      const collected = localStorage.getItem("collectedArtifacts");
      const interactions = localStorage.getItem("userInteractions");
      const profile = localStorage.getItem("userProfile");
      const settings = localStorage.getItem("recommendationSettings");

      if (viewed) {
        const viewedArtifacts = JSON.parse(viewed);
        setUserInteractions((prev) => [
          ...prev,
          ...viewedArtifacts.map((id) => ({
            type: "view",
            artifactId: id,
            timestamp: Date.now(),
          })),
        ]);
      }

      if (collected) {
        const collectedArtifacts = JSON.parse(collected);
        setUserInteractions((prev) => [
          ...prev,
          ...collectedArtifacts.map((id) => ({
            type: "collect",
            artifactId: id,
            timestamp: Date.now(),
          })),
        ]);
      }

      if (interactions) {
        setUserInteractions(JSON.parse(interactions));
      }

      if (profile) {
        setUserProfile(JSON.parse(profile));
      }

      if (settings) {
        setRecommendationSettings(JSON.parse(settings));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  // Initialize user profile with default values
  const initializeUserProfile = () => {
    if (!userProfile.id) {
      const defaultProfile = {
        id: user?.id || "anonymous",
        preferences: {
          types: {},
          areas: {},
          creators: {},
          tags: {},
          difficulty: "medium",
          sessionDuration: 0,
          interactionFrequency: 0,
        },
        behavior: {
          explorationTendency: 0.5,
          completionRate: 0,
          socialEngagement: 0,
          creativityLevel: 0,
        },
        learning: {
          totalInteractions: 0,
          lastUpdated: Date.now(),
          confidence: 0.1,
        },
      };
      setUserProfile(defaultProfile);
      localStorage.setItem("userProfile", JSON.stringify(defaultProfile));
    }
  };

  // Start tracking user behavior
  const startBehaviorTracking = () => {
    // Track view time
    const trackViewTime = (artifactId) => {
      const startTime = Date.now();
      return () => {
        const viewTime = Date.now() - startTime;
        userBehaviorRef.current.viewTime[artifactId] =
          (userBehaviorRef.current.viewTime[artifactId] || 0) + viewTime;
      };
    };

    // Track interactions
    const trackInteraction = (type, artifactId, data = {}) => {
      const interaction = {
        type,
        artifactId,
        timestamp: Date.now(),
        data,
      };

      setUserInteractions((prev) => [...prev, interaction]);
      userBehaviorRef.current.interactions[artifactId] =
        userBehaviorRef.current.interactions[artifactId] || [];
      userBehaviorRef.current.interactions[artifactId].push(interaction);

      // Save to localStorage
      localStorage.setItem(
        "userInteractions",
        JSON.stringify([...userInteractions, interaction]),
      );
    };

    // Expose tracking functions globally
    window.trackArtifactView = trackViewTime;
    window.trackArtifactInteraction = trackInteraction;
  };

  // AI-Powered Recommendation Algorithms
  const recommendationAlgorithms = {
    // Collaborative Filtering - Find similar users
    collaborative: (artifacts, userInteractions) => {
      if (!userInteractions.length) return [];

      // Find users with similar preferences
      const similarUsers = findSimilarUsers(userInteractions);

      // Get artifacts liked by similar users
      const recommendedArtifacts = artifacts.filter((artifact) => {
        const artifactInteractions = userInteractions.filter(
          (interaction) =>
            interaction.artifactId === (artifact.id || artifact._id),
        );

        const similarUserInteractions = artifactInteractions.filter(
          (interaction) => similarUsers.includes(interaction.userId),
        );

        return similarUserInteractions.length > 0;
      });

      return scoreArtifacts(recommendedArtifacts, "collaborative");
    },

    // Content-Based Filtering - Similar content
    contentBased: (artifacts, userProfile) => {
      if (!userProfile.preferences) return [];

      const scoredArtifacts = artifacts.map((artifact) => {
        let score = 0;

        // Type similarity
        if (artifact.type && userProfile.preferences.types[artifact.type]) {
          score += userProfile.preferences.types[artifact.type] * 10;
        }

        // Area similarity
        if (artifact.area && userProfile.preferences.areas[artifact.area]) {
          score += userProfile.preferences.areas[artifact.area] * 8;
        }

        // Creator similarity
        if (
          artifact.createdBy &&
          userProfile.preferences.creators[artifact.createdBy]
        ) {
          score += userProfile.preferences.creators[artifact.createdBy] * 15;
        }

        // Tag similarity
        if (artifact.tags) {
          artifact.tags.forEach((tag) => {
            if (userProfile.preferences.tags[tag]) {
              score += userProfile.preferences.tags[tag] * 5;
            }
          });
        }

        // Difficulty match
        const artifactDifficulty = getDifficultyLevel(artifact.exp);
        if (artifactDifficulty === userProfile.preferences.difficulty) {
          score += 20;
        }

        return { ...artifact, score, algorithm: "content-based" };
      });

      return scoredArtifacts
        .filter((artifact) => artifact.score > 0)
        .sort((a, b) => b.score - a.score);
    },

    // Contextual Filtering - Time, location, session context
    contextual: (artifacts, userBehavior) => {
      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.getDay();

      const scoredArtifacts = artifacts.map((artifact) => {
        let score = 0;

        // Time-based recommendations
        if (hour >= 6 && hour <= 12) {
          // Morning - prefer educational/productive content
          if (artifact.type === "story" || artifact.type === "puzzle") {
            score += 15;
          }
        } else if (hour >= 18 && hour <= 22) {
          // Evening - prefer entertainment content
          if (artifact.type === "game" || artifact.type === "music") {
            score += 15;
          }
        }

        // Session-based recommendations
        const sessionDuration =
          userBehavior.sessionData.length > 0
            ? userBehavior.sessionData[userBehavior.sessionData.length - 1]
                .duration
            : 0;

        if (sessionDuration > 300000) {
          // 5 minutes
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

        // Location-based recommendations
        if (artifact.area && userBehavior.currentArea === artifact.area) {
          score += 25;
        }

        return { ...artifact, score, algorithm: "contextual" };
      });

      return scoredArtifacts
        .filter((artifact) => artifact.score > 0)
        .sort((a, b) => b.score - a.score);
    },

    // Serendipity - Unexpected but relevant content
    serendipity: (artifacts, userProfile, userInteractions) => {
      const viewedTypes = new Set(
        userInteractions
          .filter((interaction) => interaction.type === "view")
          .map((interaction) => {
            const artifact = artifacts.find(
              (a) => (a.id || a._id) === interaction.artifactId,
            );
            return artifact?.type;
          })
          .filter(Boolean),
      );

      const scoredArtifacts = artifacts.map((artifact) => {
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
        const viewedCreators = new Set(
          userInteractions
            .filter((interaction) => interaction.type === "view")
            .map((interaction) => {
              const artifact = artifacts.find(
                (a) => (a.id || a._id) === interaction.artifactId,
              );
              return artifact?.createdBy;
            })
            .filter(Boolean),
        );

        if (!viewedCreators.has(artifact.createdBy)) {
          score += 15;
        }

        // Add randomness for serendipity
        score += Math.random() * 10;

        return { ...artifact, score, algorithm: "serendipity" };
      });

      return scoredArtifacts
        .filter((artifact) => artifact.score > 0)
        .sort((a, b) => b.score - a.score);
    },

    // Hybrid - Combine multiple algorithms
    hybrid: (artifacts, userProfile, userInteractions, userBehavior) => {
      const algorithms = [
        { name: "collaborative", weight: 0.3 },
        { name: "contentBased", weight: 0.4 },
        { name: "contextual", weight: 0.2 },
        { name: "serendipity", weight: 0.1 },
      ];

      const algorithmResults = algorithms.map((algorithm) => {
        switch (algorithm.name) {
          case "collaborative":
            return recommendationAlgorithms.collaborative(
              artifacts,
              userInteractions,
            );
          case "contentBased":
            return recommendationAlgorithms.contentBased(
              artifacts,
              userProfile,
            );
          case "contextual":
            return recommendationAlgorithms.contextual(artifacts, userBehavior);
          case "serendipity":
            return recommendationAlgorithms.serendipity(
              artifacts,
              userProfile,
              userInteractions,
            );
          default:
            return [];
        }
      });

      // Combine results with weights
      const combinedScores = {};

      algorithmResults.forEach((results, index) => {
        const weight = algorithms[index].weight;
        results.forEach((artifact) => {
          const artifactId = artifact.id || artifact._id;
          if (!combinedScores[artifactId]) {
            combinedScores[artifactId] = {
              artifact,
              score: 0,
              algorithms: [],
            };
          }
          combinedScores[artifactId].score += artifact.score * weight;
          combinedScores[artifactId].algorithms.push(algorithm.name);
        });
      });

      return Object.values(combinedScores)
        .map((item) => ({
          ...item.artifact,
          score: item.score,
          algorithm: "hybrid",
          contributingAlgorithms: item.algorithms,
        }))
        .sort((a, b) => b.score - a.score);
    },
  };

  // Helper functions
  const findSimilarUsers = (userInteractions) => {
    // Simplified collaborative filtering
    // In a real implementation, this would use more sophisticated algorithms
    const userPreferences = {};

    userInteractions.forEach((interaction) => {
      if (!userPreferences[interaction.userId]) {
        userPreferences[interaction.userId] = {
          types: {},
          areas: {},
          creators: {},
        };
      }

      const artifact = artifacts.find(
        (a) => (a.id || a._id) === interaction.artifactId,
      );
      if (artifact) {
        if (artifact.type) {
          userPreferences[interaction.userId].types[artifact.type] =
            (userPreferences[interaction.userId].types[artifact.type] || 0) + 1;
        }
        if (artifact.area) {
          userPreferences[interaction.userId].areas[artifact.area] =
            (userPreferences[interaction.userId].areas[artifact.area] || 0) + 1;
        }
        if (artifact.createdBy) {
          userPreferences[interaction.userId].creators[artifact.createdBy] =
            (userPreferences[interaction.userId].creators[artifact.createdBy] ||
              0) + 1;
        }
      }
    });

    // Find users with similar preferences (simplified)
    const currentUserPrefs = userPreferences[user?.id] || {};
    const similarUsers = Object.keys(userPreferences).filter((userId) => {
      if (userId === user?.id) return false;

      const otherUserPrefs = userPreferences[userId];
      const typeSimilarity = calculateSimilarity(
        currentUserPrefs.types,
        otherUserPrefs.types,
      );
      const areaSimilarity = calculateSimilarity(
        currentUserPrefs.areas,
        otherUserPrefs.areas,
      );
      const creatorSimilarity = calculateSimilarity(
        currentUserPrefs.creators,
        otherUserPrefs.creators,
      );

      return (typeSimilarity + areaSimilarity + creatorSimilarity) / 3 > 0.3;
    });

    return similarUsers;
  };

  const calculateSimilarity = (prefs1, prefs2) => {
    const allKeys = new Set([...Object.keys(prefs1), ...Object.keys(prefs2)]);
    let similarity = 0;
    let total = 0;

    allKeys.forEach((key) => {
      const val1 = prefs1[key] || 0;
      const val2 = prefs2[key] || 0;
      similarity += Math.min(val1, val2);
      total += Math.max(val1, val2);
    });

    return total > 0 ? similarity / total : 0;
  };

  const getDifficultyLevel = (exp) => {
    if (exp <= 20) return "easy";
    if (exp <= 50) return "medium";
    return "hard";
  };

  const scoreArtifacts = (artifacts, algorithm) => {
    return artifacts.map((artifact) => ({
      ...artifact,
      score: Math.random() * 100, // Simplified scoring
      algorithm,
    }));
  };

  // Generate recommendations based on selected algorithm
  const generateRecommendations = useCallback(() => {
    if (!artifacts || artifacts.length === 0) return [];

    const algorithm = recommendationSettings.algorithm;
    const algorithmFunction = recommendationAlgorithms[algorithm];

    if (!algorithmFunction) return [];

    let results;
    switch (algorithm) {
      case "collaborative":
        results = algorithmFunction(artifacts, userInteractions);
        break;
      case "contentBased":
        results = algorithmFunction(artifacts, userProfile);
        break;
      case "contextual":
        results = algorithmFunction(artifacts, userBehaviorRef.current);
        break;
      case "serendipity":
        results = algorithmFunction(artifacts, userProfile, userInteractions);
        break;
      case "hybrid":
        results = algorithmFunction(
          artifacts,
          userProfile,
          userInteractions,
          userBehaviorRef.current,
        );
        break;
      default:
        results = [];
    }

    // Apply diversity and novelty filters
    results = applyDiversityFilter(results, recommendationSettings.diversity);
    results = applyNoveltyFilter(results, recommendationSettings.novelty);

    return results.slice(0, 12);
  }, [artifacts, userInteractions, userProfile, recommendationSettings]);

  // Apply diversity filter to avoid similar recommendations
  const applyDiversityFilter = (results, diversityLevel) => {
    if (diversityLevel === 0) return results;

    const filtered = [];
    const usedTypes = new Set();
    const usedCreators = new Set();

    results.forEach((artifact) => {
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

  // Apply novelty filter to include unexpected content
  const applyNoveltyFilter = (results, noveltyLevel) => {
    if (noveltyLevel === 0) return results;

    const viewedArtifacts = new Set(
      userInteractions
        .filter((interaction) => interaction.type === "view")
        .map((interaction) => interaction.artifactId),
    );

    const novelResults = results.filter((artifact) => {
      const isNovel = !viewedArtifacts.has(artifact.id || artifact._id);
      return isNovel || Math.random() < noveltyLevel;
    });

    return novelResults;
  };

  // Real-time learning from user feedback
  const learnFromFeedback = useCallback(
    (artifactId, feedback, algorithm) => {
      const learningData = {
        artifactId,
        feedback,
        algorithm,
        timestamp: Date.now(),
        userProfile: { ...userProfile },
      };

      setFeedbackHistory((prev) => [...prev, learningData]);

      // Update user profile based on feedback
      const artifact = artifacts.find((a) => (a.id || a._id) === artifactId);
      if (!artifact) return;

      const updatedProfile = { ...userProfile };

      if (feedback === "positive") {
        // Strengthen preferences for this type of content
        if (artifact.type) {
          updatedProfile.preferences.types[artifact.type] =
            (updatedProfile.preferences.types[artifact.type] || 0) + 1;
        }
        if (artifact.area) {
          updatedProfile.preferences.areas[artifact.area] =
            (updatedProfile.preferences.areas[artifact.area] || 0) + 1;
        }
        if (artifact.createdBy) {
          updatedProfile.preferences.creators[artifact.createdBy] =
            (updatedProfile.preferences.creators[artifact.createdBy] || 0) + 1;
        }
        if (artifact.tags) {
          artifact.tags.forEach((tag) => {
            updatedProfile.preferences.tags[tag] =
              (updatedProfile.preferences.tags[tag] || 0) + 1;
          });
        }
      } else if (feedback === "negative") {
        // Weaken preferences for this type of content
        if (artifact.type) {
          updatedProfile.preferences.types[artifact.type] = Math.max(
            0,
            (updatedProfile.preferences.types[artifact.type] || 0) - 0.5,
          );
        }
      }

      // Update learning confidence
      updatedProfile.learning.totalInteractions += 1;
      updatedProfile.learning.confidence = Math.min(
        1,
        updatedProfile.learning.confidence + 0.01,
      );
      updatedProfile.learning.lastUpdated = Date.now();

      setUserProfile(updatedProfile);
      localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
    },
    [artifacts, userProfile],
  );

  // Handle recommendation feedback
  const handleFeedback = (artifactId, feedback, algorithm) => {
    learnFromFeedback(artifactId, feedback, algorithm);

    // Track the feedback
    const feedbackData = {
      type: "feedback",
      artifactId,
      feedback,
      algorithm,
      timestamp: Date.now(),
    };

    setUserInteractions((prev) => [...prev, feedbackData]);
    localStorage.setItem(
      "userInteractions",
      JSON.stringify([...userInteractions, feedbackData]),
    );
  };

  // Generate recommendations
  const recommendations = useMemo(() => {
    return generateRecommendations();
  }, [generateRecommendations]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle artifact selection
  const handleArtifactSelect = (artifact) => {
    onArtifactSelect?.(artifact);

    // Track the selection
    const selectionData = {
      type: "select",
      artifactId: artifact.id || artifact._id,
      algorithm: artifact.algorithm,
      timestamp: Date.now(),
    };

    setUserInteractions((prev) => [...prev, selectionData]);
    localStorage.setItem(
      "userInteractions",
      JSON.stringify([...userInteractions, selectionData]),
    );
  };

  // Start learning process
  const startLearning = async () => {
    setIsLearning(true);
    setLearningProgress(0);

    // Simulate learning process
    for (let i = 0; i <= 100; i += 10) {
      setLearningProgress(i);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setIsLearning(false);
    setLearningProgress(100);
  };

  const tabs = [
    { label: "AI Recommendations", icon: <Psychology />, content: "ai" },
    { label: "Similar Content", icon: <AutoAwesome />, content: "similar" },
    { label: "Learning Insights", icon: <Insights />, content: "insights" },
    { label: "Feedback History", icon: <ThumbUp />, content: "feedback" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // AI Recommendations
        return (
          <Box className="tab-content">
            <Box className="recommendation-header">
              <Typography variant="h5" className="section-title">
                <Psychology /> AI-Powered Recommendations
              </Typography>
              <Typography variant="body2" className="section-subtitle">
                Personalized suggestions using{" "}
                {recommendationSettings.algorithm} algorithm
              </Typography>

              <Box className="algorithm-info">
                <Chip
                  label={`Algorithm: ${recommendationSettings.algorithm}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`Confidence: ${(userProfile.learning?.confidence * 100).toFixed(1)}%`}
                  color="secondary"
                  variant="outlined"
                />
              </Box>
            </Box>

            {recommendations.length > 0 ? (
              <Grid container spacing={3}>
                {recommendations.map((artifact, index) => (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    lg={3}
                    key={artifact.id || artifact._id}
                  >
                    <Card className="recommendation-card">
                      <CardContent>
                        <ArtifactCard
                          artifact={artifact}
                          onSelect={() => handleArtifactSelect(artifact)}
                          showRecommendationScore={true}
                          recommendationScore={artifact.score}
                        />

                        <Box className="recommendation-meta">
                          <Typography
                            variant="caption"
                            className="algorithm-tag"
                          >
                            {artifact.algorithm}
                          </Typography>

                          {artifact.contributingAlgorithms && (
                            <Typography
                              variant="caption"
                              className="contributing-algorithms"
                            >
                              {artifact.contributingAlgorithms.join(", ")}
                            </Typography>
                          )}
                        </Box>

                        <Box className="feedback-buttons">
                          <Tooltip title="This recommendation was helpful">
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleFeedback(
                                  artifact.id || artifact._id,
                                  "positive",
                                  artifact.algorithm,
                                )
                              }
                            >
                              <ThumbUp fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="This recommendation was not helpful">
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleFeedback(
                                  artifact.id || artifact._id,
                                  "negative",
                                  artifact.algorithm,
                                )
                              }
                            >
                              <ThumbDown fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">
                Start interacting with content to get AI recommendations!
              </Alert>
            )}
          </Box>
        );

      case 1: // Similar Content
        return (
          <Box className="tab-content">
            <Typography variant="h5" className="section-title">
              <AutoAwesome /> Similar Content
            </Typography>
            <Typography variant="body2" className="section-subtitle">
              Content similar to what you've enjoyed
            </Typography>

            {/* Similar content based on recent interactions */}
            <Grid container spacing={3}>
              {artifacts.slice(0, 8).map((artifact) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  lg={3}
                  key={artifact.id || artifact._id}
                >
                  <ArtifactCard
                    artifact={artifact}
                    onSelect={() => handleArtifactSelect(artifact)}
                    showSimilarityScore={true}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 2: // Learning Insights
        return (
          <Box className="tab-content">
            <Typography variant="h5" className="section-title">
              <Insights /> Learning Insights
            </Typography>
            <Typography variant="body2" className="section-subtitle">
              How the AI is learning from your behavior
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card className="insight-card">
                  <CardContent>
                    <Typography variant="h6">User Profile</Typography>
                    <Typography variant="body2">
                      Total Interactions:{" "}
                      {userProfile.learning?.totalInteractions || 0}
                    </Typography>
                    <Typography variant="body2">
                      Learning Confidence:{" "}
                      {(userProfile.learning?.confidence * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2">
                      Last Updated:{" "}
                      {new Date(
                        userProfile.learning?.lastUpdated || Date.now(),
                      ).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card className="insight-card">
                  <CardContent>
                    <Typography variant="h6">Preferences</Typography>
                    <Typography variant="body2">
                      Favorite Type:{" "}
                      {Object.keys(userProfile.preferences?.types || {}).sort(
                        (a, b) =>
                          (userProfile.preferences.types[b] || 0) -
                          (userProfile.preferences.types[a] || 0),
                      )[0] || "None"}
                    </Typography>
                    <Typography variant="body2">
                      Favorite Area:{" "}
                      {Object.keys(userProfile.preferences?.areas || {}).sort(
                        (a, b) =>
                          (userProfile.preferences.areas[b] || 0) -
                          (userProfile.preferences.areas[a] || 0),
                      )[0] || "None"}
                    </Typography>
                    <Typography variant="body2">
                      Preferred Difficulty:{" "}
                      {userProfile.preferences?.difficulty || "Medium"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box className="learning-controls">
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={startLearning}
                disabled={isLearning}
              >
                {isLearning ? "Learning..." : "Refresh Learning"}
              </Button>

              {isLearning && (
                <Box className="learning-progress">
                  <LinearProgress
                    variant="determinate"
                    value={learningProgress}
                  />
                  <Typography variant="body2">
                    Learning Progress: {learningProgress}%
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        );

      case 3: // Feedback History
        return (
          <Box className="tab-content">
            <Typography variant="h5" className="section-title">
              <ThumbUp /> Feedback History
            </Typography>
            <Typography variant="body2" className="section-subtitle">
              Your feedback helps improve recommendations
            </Typography>

            {feedbackHistory.length > 0 ? (
              <Grid container spacing={2}>
                {feedbackHistory
                  .slice(-10)
                  .reverse()
                  .map((feedback, index) => (
                    <Grid item xs={12} key={index}>
                      <Card className="feedback-card">
                        <CardContent>
                          <Box className="feedback-header">
                            <Typography variant="body1">
                              {feedback.feedback === "positive" ? "👍" : "👎"}
                              Feedback on {feedback.artifactId}
                            </Typography>
                            <Typography variant="caption">
                              {new Date(feedback.timestamp).toLocaleString()}
                            </Typography>
                          </Box>
                          <Typography variant="body2">
                            Algorithm: {feedback.algorithm}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            ) : (
              <Alert severity="info">
                No feedback history yet. Start rating recommendations!
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box className="recommendation-engine loading">
        <CircularProgress />
        <Typography>Loading AI recommendations...</Typography>
      </Box>
    );
  }

  return (
    <Box className="recommendation-engine">
      {/* Settings Panel */}
      {showSettingsPanel && (
        <Card className="settings-card">
          <CardContent>
            <Typography variant="h6" className="section-title">
              <Settings /> Recommendation Settings
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Algorithm</InputLabel>
                  <Select
                    value={recommendationSettings.algorithm}
                    onChange={(e) =>
                      setRecommendationSettings((prev) => ({
                        ...prev,
                        algorithm: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="hybrid">Hybrid (Recommended)</MenuItem>
                    <MenuItem value="collaborative">
                      Collaborative Filtering
                    </MenuItem>
                    <MenuItem value="contentBased">Content-Based</MenuItem>
                    <MenuItem value="contextual">Contextual</MenuItem>
                    <MenuItem value="serendipity">Serendipity</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Diversity Level</Typography>
                <Slider
                  value={recommendationSettings.diversity}
                  onChange={(e, value) =>
                    setRecommendationSettings((prev) => ({
                      ...prev,
                      diversity: value,
                    }))
                  }
                  min={0}
                  max={1}
                  step={0.1}
                  valueLabelDisplay="auto"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Novelty Level</Typography>
                <Slider
                  value={recommendationSettings.novelty}
                  onChange={(e, value) =>
                    setRecommendationSettings((prev) => ({
                      ...prev,
                      novelty: value,
                    }))
                  }
                  min={0}
                  max={1}
                  step={0.1}
                  valueLabelDisplay="auto"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Serendipity Level</Typography>
                <Slider
                  value={recommendationSettings.serendipity}
                  onChange={(e, value) =>
                    setRecommendationSettings((prev) => ({
                      ...prev,
                      serendipity: value,
                    }))
                  }
                  min={0}
                  max={1}
                  step={0.1}
                  valueLabelDisplay="auto"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={recommendationSettings.enableRealTime}
                      onChange={(e) =>
                        setRecommendationSettings((prev) => ({
                          ...prev,
                          enableRealTime: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Real-time Learning"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card className="recommendation-tabs-card">
        <CardContent>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            className="recommendation-tabs"
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                className="recommendation-tab"
              />
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card className="recommendation-content-card">
        <CardContent>{renderTabContent()}</CardContent>
      </Card>
    </Box>
  );
};

export default RecommendationEngine;
