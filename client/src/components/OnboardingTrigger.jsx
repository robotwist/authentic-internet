import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Create,
  Lightbulb,
  Star,
  Close,
  AutoAwesome,
  Celebration,
  TrendingUp,
  School,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import OnboardingGuide from "./OnboardingGuide";
import "./OnboardingTrigger.css";

const OnboardingTrigger = () => {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcomePrompt, setShowWelcomePrompt] = useState(false);
  const [showCreationPrompt, setShowCreationPrompt] = useState(false);
  const [showInspirationPrompt, setShowInspirationPrompt] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    if (!user) return;

    // Check if user is new (no artifacts created)
    const hasCreatedArtifacts = localStorage.getItem("hasCreatedArtifacts");
    const hasCompletedOnboarding = localStorage.getItem("onboardingCompleted");
    const isFirstVisit = !localStorage.getItem("hasVisitedBefore");

    if (isFirstVisit) {
      localStorage.setItem("hasVisitedBefore", "true");
      setShowWelcomePrompt(true);
    } else if (!hasCompletedOnboarding && !hasCreatedArtifacts) {
      // Show onboarding for users who haven't completed it
      setShowOnboarding(true);
    } else if (!hasCreatedArtifacts) {
      // Show creation prompt for users who completed onboarding but haven't created anything
      setShowCreationPrompt(true);
    } else {
      // Show inspiration prompt for returning users
      setShowInspirationPrompt(true);
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setSnackbarMessage(
      "Welcome to Authentic Internet! You're ready to start creating.",
    );
    setShowSnackbar(true);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    setShowCreationPrompt(true);
  };

  const handleCreateFirstArtifact = () => {
    setShowWelcomePrompt(false);
    setShowCreationPrompt(false);
    setShowOnboarding(true);
  };

  const handleDismissPrompt = (promptType) => {
    switch (promptType) {
      case "welcome":
        setShowWelcomePrompt(false);
        break;
      case "creation":
        setShowCreationPrompt(false);
        break;
      case "inspiration":
        setShowInspirationPrompt(false);
        break;
    }
  };

  const handleSnackbarClose = () => {
    setShowSnackbar(false);
  };

  const inspirationIdeas = [
    {
      type: "STORY",
      title: "Write a Story",
      description: "Create an interactive tale with choices",
      icon: "📖",
      prompt: "Write about a character discovering a hidden world",
    },
    {
      type: "ART",
      title: "Create Art",
      description: "Share your visual creativity",
      icon: "🎨",
      prompt: "Design a character from your imagination",
    },
    {
      type: "MUSIC",
      title: "Compose Music",
      description: "Make original audio content",
      icon: "🎵",
      prompt: "Create a theme song for an adventure",
    },
    {
      type: "PUZZLE",
      title: "Design a Puzzle",
      description: "Challenge others with logic",
      icon: "🧩",
      prompt: "Create a riddle about nature",
    },
    {
      type: "GAME",
      title: "Build a Game",
      description: "Create interactive experiences",
      icon: "🎮",
      prompt: "Make a simple exploration game",
    },
  ];

  const trendingTopics = [
    "Nature & Environment",
    "Adventure & Discovery",
    "Emotions & Relationships",
    "Technology & Innovation",
    "Fantasy & Magic",
    "Science & Space",
  ];

  if (showOnboarding) {
    return (
      <OnboardingGuide
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    );
  }

  return (
    <>
      {/* Welcome Prompt for First-Time Visitors */}
      {showWelcomePrompt && (
        <Box className="onboarding-prompt welcome-prompt">
          <Card className="prompt-card">
            <CardContent>
              <Box className="prompt-header">
                <Avatar className="prompt-avatar">
                  <AutoAwesome />
                </Avatar>
                <Typography variant="h5" className="prompt-title">
                  Welcome to Authentic Internet!
                </Typography>
                <IconButton
                  onClick={() => handleDismissPrompt("welcome")}
                  className="close-button"
                >
                  <Close />
                </IconButton>
              </Box>

              <Typography variant="body1" className="prompt-description">
                You're about to enter a creative metaverse where your
                imagination becomes reality. Create games, stories, art, music,
                and puzzles that others can discover and enjoy.
              </Typography>

              <Box className="prompt-features">
                <Box className="feature-item">
                  <Create className="feature-icon" />
                  <Typography variant="body2">
                    Create amazing content
                  </Typography>
                </Box>
                <Box className="feature-item">
                  <Star className="feature-icon" />
                  <Typography variant="body2">
                    Get discovered by others
                  </Typography>
                </Box>
                <Box className="feature-item">
                  <TrendingUp className="feature-icon" />
                  <Typography variant="body2">
                    Build your creative reputation
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                size="large"
                onClick={handleCreateFirstArtifact}
                className="primary-button"
              >
                <Create />
                Start Creating
              </Button>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Creation Prompt for Users Who Haven't Created */}
      {showCreationPrompt && (
        <Box className="onboarding-prompt creation-prompt">
          <Card className="prompt-card">
            <CardContent>
              <Box className="prompt-header">
                <Avatar className="prompt-avatar">
                  <Create />
                </Avatar>
                <Typography variant="h5" className="prompt-title">
                  Ready to Create Your First Artifact?
                </Typography>
                <IconButton
                  onClick={() => handleDismissPrompt("creation")}
                  className="close-button"
                >
                  <Close />
                </IconButton>
              </Box>

              <Typography variant="body1" className="prompt-description">
                The best way to experience Authentic Internet is to create
                something amazing. Let's guide you through creating your first
                artifact!
              </Typography>

              <Box className="creation-options">
                {inspirationIdeas.slice(0, 3).map((idea, index) => (
                  <Card key={index} className="idea-card">
                    <CardContent>
                      <Typography variant="h1" className="idea-icon">
                        {idea.icon}
                      </Typography>
                      <Typography variant="h6" className="idea-title">
                        {idea.title}
                      </Typography>
                      <Typography variant="body2" className="idea-description">
                        {idea.description}
                      </Typography>
                      <Typography variant="caption" className="idea-prompt">
                        "{idea.prompt}"
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              <Button
                variant="contained"
                size="large"
                onClick={handleCreateFirstArtifact}
                className="primary-button"
              >
                <School />
                Start Guided Creation
              </Button>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Inspiration Prompt for Returning Users */}
      {showInspirationPrompt && (
        <Box className="onboarding-prompt inspiration-prompt">
          <Card className="prompt-card">
            <CardContent>
              <Box className="prompt-header">
                <Avatar className="prompt-avatar">
                  <Lightbulb />
                </Avatar>
                <Typography variant="h5" className="prompt-title">
                  Looking for Inspiration?
                </Typography>
                <IconButton
                  onClick={() => handleDismissPrompt("inspiration")}
                  className="close-button"
                >
                  <Close />
                </IconButton>
              </Box>

              <Typography variant="body1" className="prompt-description">
                Here are some trending topics and ideas to spark your next
                creation:
              </Typography>

              <Box className="trending-topics">
                {trendingTopics.map((topic, index) => (
                  <Chip
                    key={index}
                    label={topic}
                    className="topic-chip"
                    onClick={() => {
                      // Navigate to creation with topic pre-selected
                      window.location.href = `/create?inspiration=${encodeURIComponent(topic)}`;
                    }}
                  />
                ))}
              </Box>

              <Box className="inspiration-actions">
                <Button
                  variant="outlined"
                  onClick={() => {
                    window.location.href = "/artifacts";
                  }}
                  className="secondary-button"
                >
                  <Star />
                  Explore Artifacts
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    window.location.href = "/create";
                  }}
                  className="primary-button"
                >
                  <Create />
                  Create New Artifact
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Success Snackbar */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          className="success-alert"
          icon={<Celebration />}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default OnboardingTrigger;
