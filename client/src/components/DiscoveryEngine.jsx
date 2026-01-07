import React, { useState, useEffect, useMemo, useCallback } from "react";
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
} from "@mui/material";
import {
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
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import ArtifactCard from "./ArtifactCard";
import "./DiscoveryEngine.css";

const DiscoveryEngine = ({ artifacts, onArtifactSelect, loading = false }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [userPreferences, setUserPreferences] = useState({});
  const [viewedArtifacts, setViewedArtifacts] = useState([]);
  const [collectedArtifacts, setCollectedArtifacts] = useState([]);

  // Load user data
  useEffect(() => {
    // Load viewed artifacts
    const viewed = localStorage.getItem("viewedArtifacts");
    if (viewed) {
      try {
        setViewedArtifacts(JSON.parse(viewed));
      } catch (error) {
        console.error("Error loading viewed artifacts:", error);
      }
    }

    // Load collected artifacts
    const collected = localStorage.getItem("collectedArtifacts");
    if (collected) {
      try {
        setCollectedArtifacts(JSON.parse(collected));
      } catch (error) {
        console.error("Error loading collected artifacts:", error);
      }
    }

    // Load user preferences
    const preferences = localStorage.getItem("userPreferences");
    if (preferences) {
      try {
        setUserPreferences(JSON.parse(preferences));
      } catch (error) {
        console.error("Error loading user preferences:", error);
      }
    }
  }, []);

  // Calculate trending artifacts based on engagement
  const trendingArtifacts = useMemo(() => {
    if (!artifacts || artifacts.length === 0) return [];

    return artifacts
      .map((artifact) => ({
        ...artifact,
        engagementScore: calculateEngagementScore(artifact),
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 10);
  }, [artifacts]);

  // Calculate engagement score
  const calculateEngagementScore = (artifact) => {
    let score = 0;

    // Rating contribution
    score += (artifact.rating || 0) * 10;

    // Review count contribution
    score += (artifact.reviews?.length || 0) * 5;

    // View count (if available)
    score += (artifact.viewCount || 0) * 0.1;

    // Recency bonus
    const createdAt = new Date(artifact.createdAt || artifact.updatedAt);
    const daysSinceCreation =
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation <= 7)
      score += 20; // New content bonus
    else if (daysSinceCreation <= 30) score += 10; // Recent content bonus

    // Creator reputation (if available)
    if (artifact.creatorReputation) {
      score += artifact.creatorReputation * 2;
    }

    return score;
  };

  // Get personalized recommendations
  const personalizedRecommendations = useMemo(() => {
    if (!artifacts || artifacts.length === 0) return [];

    // Analyze user behavior
    const userBehavior = analyzeUserBehavior();

    // Score artifacts based on user preferences
    const scoredArtifacts = artifacts
      .filter(
        (artifact) => !viewedArtifacts.includes(artifact.id || artifact._id),
      )
      .map((artifact) => ({
        ...artifact,
        recommendationScore: calculateRecommendationScore(
          artifact,
          userBehavior,
        ),
      }))
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 12);

    return scoredArtifacts;
  }, [artifacts, viewedArtifacts, userPreferences]);

  // Analyze user behavior
  const analyzeUserBehavior = () => {
    const behavior = {
      preferredTypes: {},
      preferredAreas: {},
      preferredCreators: {},
      preferredTags: {},
      averageRating: 0,
      totalInteractions: 0,
    };

    // Analyze viewed artifacts
    const viewedArtifactData = artifacts.filter((artifact) =>
      viewedArtifacts.includes(artifact.id || artifact._id),
    );

    viewedArtifactData.forEach((artifact) => {
      // Type preferences
      if (artifact.type) {
        behavior.preferredTypes[artifact.type] =
          (behavior.preferredTypes[artifact.type] || 0) + 1;
      }

      // Area preferences
      if (artifact.area) {
        behavior.preferredAreas[artifact.area] =
          (behavior.preferredAreas[artifact.area] || 0) + 1;
      }

      // Creator preferences
      if (artifact.createdBy) {
        behavior.preferredCreators[artifact.createdBy] =
          (behavior.preferredCreators[artifact.createdBy] || 0) + 1;
      }

      // Tag preferences
      if (artifact.tags) {
        artifact.tags.forEach((tag) => {
          behavior.preferredTags[tag] = (behavior.preferredTags[tag] || 0) + 1;
        });
      }

      // Rating preferences
      if (artifact.rating) {
        behavior.averageRating += artifact.rating;
      }

      behavior.totalInteractions++;
    });

    // Calculate averages
    if (behavior.totalInteractions > 0) {
      behavior.averageRating /= behavior.totalInteractions;
    }

    return behavior;
  };

  // Calculate recommendation score
  const calculateRecommendationScore = (artifact, userBehavior) => {
    let score = 0;

    // Type preference
    if (artifact.type && userBehavior.preferredTypes[artifact.type]) {
      score += userBehavior.preferredTypes[artifact.type] * 10;
    }

    // Area preference
    if (artifact.area && userBehavior.preferredAreas[artifact.area]) {
      score += userBehavior.preferredAreas[artifact.area] * 8;
    }

    // Creator preference
    if (
      artifact.createdBy &&
      userBehavior.preferredCreators[artifact.createdBy]
    ) {
      score += userBehavior.preferredCreators[artifact.createdBy] * 15;
    }

    // Tag preferences
    if (artifact.tags) {
      artifact.tags.forEach((tag) => {
        if (userBehavior.preferredTags[tag]) {
          score += userBehavior.preferredTags[tag] * 5;
        }
      });
    }

    // Rating similarity
    if (artifact.rating && userBehavior.averageRating > 0) {
      const ratingDiff = Math.abs(artifact.rating - userBehavior.averageRating);
      score += Math.max(0, 10 - ratingDiff * 2);
    }

    // Content quality indicators
    if (artifact.rating && artifact.rating >= 4) score += 20;
    if (artifact.reviews && artifact.reviews.length >= 5) score += 15;
    if (artifact.media && artifact.media.length > 0) score += 10;

    // Diversity bonus (avoid recommending too many similar items)
    const similarItems = viewedArtifacts.filter((id) => {
      const viewedArtifact = artifacts.find((a) => (a.id || a._id) === id);
      return viewedArtifact && viewedArtifact.type === artifact.type;
    }).length;

    if (similarItems < 3) score += 25; // Encourage diversity

    return score;
  };

  // Get new releases
  const newReleases = useMemo(() => {
    if (!artifacts || artifacts.length === 0) return [];

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return artifacts
      .filter((artifact) => {
        const createdAt = new Date(artifact.createdAt || artifact.updatedAt);
        return createdAt >= oneWeekAgo;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.updatedAt) -
          new Date(a.createdAt || a.updatedAt),
      )
      .slice(0, 8);
  }, [artifacts]);

  // Get popular creators
  const popularCreators = useMemo(() => {
    if (!artifacts || artifacts.length === 0) return [];

    const creatorStats = {};

    artifacts.forEach((artifact) => {
      if (artifact.createdBy) {
        if (!creatorStats[artifact.createdBy]) {
          creatorStats[artifact.createdBy] = {
            name: artifact.createdBy,
            artifactCount: 0,
            totalRating: 0,
            totalReviews: 0,
          };
        }

        creatorStats[artifact.createdBy].artifactCount++;
        creatorStats[artifact.createdBy].totalRating += artifact.rating || 0;
        creatorStats[artifact.createdBy].totalReviews +=
          artifact.reviews?.length || 0;
      }
    });

    return Object.values(creatorStats)
      .map((creator) => ({
        ...creator,
        averageRating:
          creator.artifactCount > 0
            ? creator.totalRating / creator.artifactCount
            : 0,
        popularityScore:
          creator.artifactCount * 2 +
          creator.totalReviews * 3 +
          creator.averageRating * 10,
      }))
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, 6);
  }, [artifacts]);

  // Get trending topics
  const trendingTopics = useMemo(() => {
    if (!artifacts || artifacts.length === 0) return [];

    const tagStats = {};

    artifacts.forEach((artifact) => {
      if (artifact.tags) {
        artifact.tags.forEach((tag) => {
          if (!tagStats[tag]) {
            tagStats[tag] = {
              name: tag,
              count: 0,
              totalRating: 0,
            };
          }

          tagStats[tag].count++;
          tagStats[tag].totalRating += artifact.rating || 0;
        });
      }
    });

    return Object.values(tagStats)
      .map((tag) => ({
        ...tag,
        averageRating: tag.count > 0 ? tag.totalRating / tag.count : 0,
        trendScore: tag.count * 5 + tag.averageRating * 10,
      }))
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, 10);
  }, [artifacts]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle artifact selection
  const handleArtifactSelect = (artifact) => {
    onArtifactSelect?.(artifact);

    // Update viewed artifacts
    const artifactId = artifact.id || artifact._id;
    if (!viewedArtifacts.includes(artifactId)) {
      const newViewed = [...viewedArtifacts, artifactId];
      setViewedArtifacts(newViewed);
      localStorage.setItem("viewedArtifacts", JSON.stringify(newViewed));
    }
  };

  const tabs = [
    { label: "For You", icon: <Recommend />, content: "personalized" },
    { label: "Trending", icon: <TrendingUp />, content: "trending" },
    { label: "New Releases", icon: <NewReleases />, content: "new" },
    { label: "Creators", icon: <Person />, content: "creators" },
    { label: "Topics", icon: <Category />, content: "topics" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // For You
        return (
          <Box className="tab-content">
            <Typography variant="h5" className="section-title">
              <Recommend /> Recommended for You
            </Typography>
            <Typography variant="body2" className="section-subtitle">
              Based on your viewing history and preferences
            </Typography>

            {personalizedRecommendations.length > 0 ? (
              <Grid container spacing={3}>
                {personalizedRecommendations.map((artifact) => (
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
                      showRecommendationScore={true}
                      recommendationScore={artifact.recommendationScore}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">
                Start exploring artifacts to get personalized recommendations!
              </Alert>
            )}
          </Box>
        );

      case 1: // Trending
        return (
          <Box className="tab-content">
            <Typography variant="h5" className="section-title">
              <TrendingUp /> Trending Now
            </Typography>
            <Typography variant="body2" className="section-subtitle">
              Most popular artifacts based on engagement
            </Typography>

            {trendingArtifacts.length > 0 ? (
              <Grid container spacing={3}>
                {trendingArtifacts.map((artifact, index) => (
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
                      showTrendingRank={true}
                      trendingRank={index + 1}
                      engagementScore={artifact.engagementScore}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">
                No trending artifacts available at the moment.
              </Alert>
            )}
          </Box>
        );

      case 2: // New Releases
        return (
          <Box className="tab-content">
            <Typography variant="h5" className="section-title">
              <NewReleases /> New Releases
            </Typography>
            <Typography variant="body2" className="section-subtitle">
              Fresh content from the last 7 days
            </Typography>

            {newReleases.length > 0 ? (
              <Grid container spacing={3}>
                {newReleases.map((artifact) => (
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
                      showNewBadge={true}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">No new releases in the last 7 days.</Alert>
            )}
          </Box>
        );

      case 3: // Creators
        return (
          <Box className="tab-content">
            <Typography variant="h5" className="section-title">
              <Person /> Popular Creators
            </Typography>
            <Typography variant="body2" className="section-subtitle">
              Top creators based on content quality and engagement
            </Typography>

            {popularCreators.length > 0 ? (
              <Grid container spacing={3}>
                {popularCreators.map((creator) => (
                  <Grid item xs={12} sm={6} md={4} key={creator.name}>
                    <Card className="creator-card">
                      <CardContent>
                        <Box className="creator-header">
                          <Avatar className="creator-avatar">
                            {creator.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box className="creator-info">
                            <Typography variant="h6" className="creator-name">
                              {creator.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              className="creator-stats"
                            >
                              {creator.artifactCount} artifacts •{" "}
                              {creator.averageRating.toFixed(1)} ⭐
                            </Typography>
                          </Box>
                        </Box>

                        <Box className="creator-actions">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              // Filter artifacts by this creator
                              const creatorArtifacts = artifacts.filter(
                                (a) => a.createdBy === creator.name,
                              );
                              // You could implement a callback to show these artifacts
                            }}
                          >
                            View Artifacts
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">No creator data available.</Alert>
            )}
          </Box>
        );

      case 4: // Topics
        return (
          <Box className="tab-content">
            <Typography variant="h5" className="section-title">
              <Category /> Trending Topics
            </Typography>
            <Typography variant="body2" className="section-subtitle">
              Popular tags and themes
            </Typography>

            {trendingTopics.length > 0 ? (
              <Box className="topics-container">
                {trendingTopics.map((topic, index) => (
                  <Chip
                    key={topic.name}
                    label={`${topic.name} (${topic.count})`}
                    className="topic-chip"
                    icon={index < 3 ? <Whatshot /> : undefined}
                    onClick={() => {
                      // Filter artifacts by this topic
                      const topicArtifacts = artifacts.filter(
                        (a) => a.tags && a.tags.includes(topic.name),
                      );
                      // You could implement a callback to show these artifacts
                    }}
                  />
                ))}
              </Box>
            ) : (
              <Alert severity="info">No trending topics available.</Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box className="discovery-engine loading">
        <CircularProgress />
        <Typography>Loading discovery recommendations...</Typography>
      </Box>
    );
  }

  return (
    <Box className="discovery-engine">
      <Card className="discovery-header-card">
        <CardContent>
          <Typography variant="h4" className="discovery-title">
            <Explore /> Discover Amazing Content
          </Typography>
          <Typography variant="body1" className="discovery-subtitle">
            Find the best artifacts, creators, and trending topics
          </Typography>
        </CardContent>
      </Card>

      <Card className="discovery-tabs-card">
        <CardContent>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            className="discovery-tabs"
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                className="discovery-tab"
              />
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card className="discovery-content-card">
        <CardContent>{renderTabContent()}</CardContent>
      </Card>
    </Box>
  );
};

export default DiscoveryEngine;
