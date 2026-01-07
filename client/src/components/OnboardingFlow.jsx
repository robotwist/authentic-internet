import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  PlayArrow,
  Create,
  Explore,
  Star,
  Lightbulb,
  School,
  Celebration,
  ArrowForward,
  ArrowBack,
  Close,
  Help,
  AutoAwesome,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./OnboardingFlow.css";

const OnboardingFlow = ({ onComplete, onSkip }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [artifactData, setArtifactData] = useState({
    name: "",
    description: "",
    type: "",
    content: "",
    tags: [],
    inspiration: "",
    difficulty: "beginner",
  });
  const [showInspirationModal, setShowInspirationModal] = useState(false);
  const [selectedInspiration, setSelectedInspiration] = useState(null);

  // Check if user has completed onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem("onboardingCompleted");
    if (hasCompletedOnboarding) {
      onComplete?.();
    }
  }, [onComplete]);

  const steps = [
    {
      title: "Welcome to Authentic Internet",
      description:
        "Discover the creative metaverse where your imagination becomes reality",
      icon: <AutoAwesome />,
    },
    {
      title: "Choose Your Creative Path",
      description: "What type of content would you like to create?",
      icon: <Create />,
    },
    {
      title: "Find Your Inspiration",
      description: "Get inspired by amazing examples and prompts",
      icon: <Lightbulb />,
    },
    {
      title: "Create Your First Artifact",
      description: "Bring your idea to life with our guided creation process",
      icon: <School />,
    },
    {
      title: "Share and Discover",
      description: "Learn how to share your creation and discover others",
      icon: <Explore />,
    },
    {
      title: "Celebrate Your Achievement",
      description: "Congratulations! You've created your first artifact",
      icon: <Celebration />,
    },
  ];

  const artifactTypes = [
    {
      type: "STORY",
      title: "Interactive Story",
      description:
        "Create branching narratives, poems, or character monologues",
      icon: "📖",
      examples: [
        "Choose-your-own-adventure",
        "Poetry collection",
        "Character backstory",
      ],
      prompts: [
        "Write a story about a character discovering a hidden world",
        "Create a poem about your favorite place",
        "Develop a character who has a unique power or ability",
      ],
    },
    {
      type: "ART",
      title: "Visual Art",
      description: "Share digital paintings, photography, or concept art",
      icon: "🎨",
      examples: ["Digital painting", "Photography series", "Character design"],
      prompts: [
        "Design a character from your favorite story",
        "Create a landscape from your imagination",
        "Make art inspired by your favorite music",
      ],
    },
    {
      type: "MUSIC",
      title: "Music & Audio",
      description: "Compose original music, soundscapes, or audio stories",
      icon: "🎵",
      examples: ["Original composition", "Sound effects", "Audio narrative"],
      prompts: [
        "Create a theme song for a character",
        "Make ambient sounds for a peaceful place",
        "Compose music that tells a story",
      ],
    },
    {
      type: "PUZZLE",
      title: "Interactive Puzzle",
      description: "Design logic challenges, riddles, or brain teasers",
      icon: "🧩",
      examples: ["Logic puzzle", "Riddle", "Escape room"],
      prompts: [
        "Create a puzzle about finding hidden treasure",
        "Design a riddle about nature",
        "Make a logic challenge about friendship",
      ],
    },
    {
      type: "GAME",
      title: "Mini Game",
      description: "Build simple games, challenges, or interactive experiences",
      icon: "🎮",
      examples: ["Simple platformer", "Quiz game", "Interactive story"],
      prompts: [
        "Create a game about exploring a magical forest",
        "Design a quiz about your favorite topic",
        "Make an interactive adventure",
      ],
    },
  ];

  const inspirationExamples = [
    {
      id: "nature",
      title: "Nature & Environment",
      description: "Inspired by the beauty and wonder of the natural world",
      examples: [
        {
          type: "STORY",
          title: "The Whispering Trees",
          description: "A story about trees that can communicate",
        },
        {
          type: "ART",
          title: "Mountain Sunrise",
          description: "A painting of dawn breaking over peaks",
        },
        {
          type: "MUSIC",
          title: "Forest Ambience",
          description: "Sounds of a peaceful woodland",
        },
      ],
    },
    {
      id: "adventure",
      title: "Adventure & Discovery",
      description: "Tales of exploration, quests, and new horizons",
      examples: [
        {
          type: "STORY",
          title: "The Lost Map",
          description: "A treasure hunt story with choices",
        },
        {
          type: "PUZZLE",
          title: "Ancient Riddle",
          description: "Solve puzzles to unlock ancient secrets",
        },
        {
          type: "GAME",
          title: "Explorer Quest",
          description: "Navigate through unknown lands",
        },
      ],
    },
    {
      id: "emotions",
      title: "Emotions & Relationships",
      description: "Stories about feelings, friendship, and human connection",
      examples: [
        {
          type: "STORY",
          title: "The Friendship Letter",
          description: "A story about reconnecting with old friends",
        },
        {
          type: "ART",
          title: "Joy and Sadness",
          description: "Art representing emotional contrasts",
        },
        {
          type: "MUSIC",
          title: "Heartbeat Melody",
          description: "Music that captures different emotions",
        },
      ],
    },
    {
      id: "technology",
      title: "Technology & Innovation",
      description: "Futuristic ideas, inventions, and digital worlds",
      examples: [
        {
          type: "STORY",
          title: "The AI Companion",
          description: "A story about artificial intelligence friendship",
        },
        {
          type: "PUZZLE",
          title: "Digital Codebreaker",
          description: "Solve puzzles using technology",
        },
        {
          type: "GAME",
          title: "Robot Factory",
          description: "Build and program robots",
        },
      ],
    },
  ];

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      completeOnboarding();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSkip = () => {
    onSkip?.();
  };

  const handleTypeSelect = (type) => {
    setArtifactData((prev) => ({ ...prev, type }));
    handleNext();
  };

  const handleInspirationSelect = (inspiration) => {
    setSelectedInspiration(inspiration);
    setShowInspirationModal(true);
  };

  const handleInspirationConfirm = () => {
    if (selectedInspiration) {
      setArtifactData((prev) => ({
        ...prev,
        inspiration: selectedInspiration.title,
        content: selectedInspiration.description,
      }));
    }
    setShowInspirationModal(false);
    handleNext();
  };

  const handleArtifactSubmit = async (artifactData) => {
    try {
      // Submit artifact creation
      const response = await fetch("/api/artifacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...artifactData,
          location: { x: 5, y: 5, mapName: "overworld" },
          area: "overworld",
          exp: 25,
          visible: true,
          tags: artifactData.tags,
          createdBy: user?.id,
        }),
      });

      if (response.ok) {
        handleNext();
      } else {
        throw new Error("Failed to create artifact");
      }
    } catch (error) {
      console.error("Error creating artifact:", error);
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem("onboardingCompleted", "true");
    localStorage.setItem("firstArtifactCreated", "true");
    onComplete?.();
  };

  const renderWelcomeStep = () => (
    <Box className="onboarding-step">
      <Box className="welcome-hero">
        <Typography variant="h2" className="welcome-title">
          Welcome to Authentic Internet
        </Typography>
        <Typography variant="h5" className="welcome-subtitle">
          The Creative Metaverse Where Your Imagination Becomes Reality
        </Typography>
        <Box className="welcome-features">
          <Box className="feature">
            <Create className="feature-icon" />
            <Typography variant="h6">Create</Typography>
            <Typography>Games, stories, art, music, and puzzles</Typography>
          </Box>
          <Box className="feature">
            <Explore className="feature-icon" />
            <Typography variant="h6">Discover</Typography>
            <Typography>Amazing content from creators worldwide</Typography>
          </Box>
          <Box className="feature">
            <Star className="feature-icon" />
            <Typography variant="h6">Connect</Typography>
            <Typography>Share, collaborate, and build together</Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          size="large"
          onClick={() => setShowWelcome(false)}
          className="get-started-button"
        >
          Get Started
          <ArrowForward />
        </Button>
      </Box>
    </Box>
  );

  const renderTypeSelection = () => (
    <Box className="onboarding-step">
      <Typography variant="h4" className="step-title">
        Choose Your Creative Path
      </Typography>
      <Typography variant="body1" className="step-description">
        What type of content would you like to create? Don't worry - you can
        always try different types later!
      </Typography>

      <Grid container spacing={3} className="type-grid">
        {artifactTypes.map((type) => (
          <Grid item xs={12} md={6} lg={4} key={type.type}>
            <Card
              className="type-card"
              onClick={() => handleTypeSelect(type.type)}
            >
              <CardContent>
                <Box className="type-header">
                  <Typography variant="h1" className="type-icon">
                    {type.icon}
                  </Typography>
                  <Typography variant="h5" className="type-title">
                    {type.title}
                  </Typography>
                </Box>
                <Typography variant="body2" className="type-description">
                  {type.description}
                </Typography>
                <Box className="type-examples">
                  <Typography variant="caption" color="textSecondary">
                    Examples:
                  </Typography>
                  {type.examples.map((example, index) => (
                    <Chip
                      key={index}
                      label={example}
                      size="small"
                      className="example-chip"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderInspirationStep = () => (
    <Box className="onboarding-step">
      <Typography variant="h4" className="step-title">
        Find Your Inspiration
      </Typography>
      <Typography variant="body1" className="step-description">
        Get inspired by these themes and examples. Click on any inspiration to
        see detailed examples!
      </Typography>

      <Grid container spacing={3} className="inspiration-grid">
        {inspirationExamples.map((inspiration) => (
          <Grid item xs={12} md={6} key={inspiration.id}>
            <Card
              className="inspiration-card"
              onClick={() => handleInspirationSelect(inspiration)}
            >
              <CardContent>
                <Typography variant="h6" className="inspiration-title">
                  {inspiration.title}
                </Typography>
                <Typography variant="body2" className="inspiration-description">
                  {inspiration.description}
                </Typography>
                <Box className="inspiration-examples">
                  {inspiration.examples.slice(0, 2).map((example, index) => (
                    <Box key={index} className="example-item">
                      <Chip
                        label={example.type}
                        size="small"
                        className="type-chip"
                      />
                      <Typography variant="body2">{example.title}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Button
        variant="outlined"
        onClick={handleNext}
        className="skip-inspiration-button"
      >
        I have my own idea
      </Button>
    </Box>
  );

  const renderCreationStep = () => (
    <Box className="onboarding-step">
      <Typography variant="h4" className="step-title">
        Create Your First Artifact
      </Typography>
      <Typography variant="body1" className="step-description">
        Let's bring your idea to life! We'll guide you through each step.
      </Typography>

      <Box className="creation-form">
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Artifact Name"
              value={artifactData.name}
              onChange={(e) =>
                setArtifactData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Give your creation a memorable name"
              className="form-field"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth className="form-field">
              <InputLabel>Difficulty Level</InputLabel>
              <Select
                value={artifactData.difficulty}
                onChange={(e) =>
                  setArtifactData((prev) => ({
                    ...prev,
                    difficulty: e.target.value,
                  }))
                }
              >
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={artifactData.description}
              onChange={(e) =>
                setArtifactData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe what your artifact is about"
              className="form-field"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Content"
              value={artifactData.content}
              onChange={(e) =>
                setArtifactData((prev) => ({
                  ...prev,
                  content: e.target.value,
                }))
              }
              placeholder="Write your story, describe your art, or create your puzzle..."
              className="form-field"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Tags"
              value={artifactData.tags.join(", ")}
              onChange={(e) =>
                setArtifactData((prev) => ({
                  ...prev,
                  tags: e.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter((tag) => tag),
                }))
              }
              placeholder="Add tags separated by commas (e.g., adventure, fantasy, beginner)"
              className="form-field"
            />
          </Grid>
        </Grid>

        <Box className="creation-actions">
          <Button
            variant="contained"
            size="large"
            onClick={() => handleArtifactSubmit(artifactData)}
            disabled={!artifactData.name || !artifactData.content}
            className="create-button"
          >
            Create My Artifact
            <AutoAwesome />
          </Button>
        </Box>
      </Box>
    </Box>
  );

  const renderDiscoveryStep = () => (
    <Box className="onboarding-step">
      <Typography variant="h4" className="step-title">
        Share and Discover
      </Typography>
      <Typography variant="body1" className="step-description">
        Learn how to share your creation and discover amazing content from other
        creators.
      </Typography>

      <Grid container spacing={3} className="discovery-grid">
        <Grid item xs={12} md={4}>
          <Card className="discovery-card">
            <CardContent>
              <Typography variant="h6">Share Your Creation</Typography>
              <Typography variant="body2">
                Your artifact is now live in the world! Others can discover,
                play, and rate it.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card className="discovery-card">
            <CardContent>
              <Typography variant="h6">Discover Others</Typography>
              <Typography variant="body2">
                Explore artifacts by type, rating, or creator. Find inspiration
                for your next creation!
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card className="discovery-card">
            <CardContent>
              <Typography variant="h6">Connect & Collaborate</Typography>
              <Typography variant="body2">
                Follow creators you love, join challenges, and collaborate on
                projects.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box className="discovery-actions">
        <Button
          variant="outlined"
          onClick={() => navigate("/artifacts")}
          className="explore-button"
        >
          Explore Artifacts
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          className="continue-button"
        >
          Continue
        </Button>
      </Box>
    </Box>
  );

  const renderCelebrationStep = () => (
    <Box className="onboarding-step celebration">
      <Box className="celebration-content">
        <Typography variant="h2" className="celebration-title">
          🎉 Congratulations! 🎉
        </Typography>
        <Typography variant="h5" className="celebration-subtitle">
          You've Created Your First Artifact
        </Typography>
        <Typography variant="body1" className="celebration-description">
          You're now part of the Authentic Internet creative community! Your
          artifact is live and ready to inspire others.
        </Typography>

        <Box className="achievement-badge">
          <Avatar className="badge-avatar">
            <AutoAwesome />
          </Avatar>
          <Typography variant="h6">First Creator</Typography>
          <Typography variant="body2">Created your first artifact</Typography>
        </Box>

        <Box className="celebration-actions">
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/game")}
            className="play-button"
          >
            <PlayArrow />
            Start Playing
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate("/create")}
            className="create-more-button"
          >
            <Create />
            Create More
          </Button>
        </Box>
      </Box>
    </Box>
  );

  const renderStepContent = () => {
    if (showWelcome) {
      return renderWelcomeStep();
    }

    switch (activeStep) {
      case 0:
        return renderTypeSelection();
      case 1:
        return renderInspirationStep();
      case 2:
        return renderCreationStep();
      case 3:
        return renderDiscoveryStep();
      case 4:
        return renderCelebrationStep();
      default:
        return null;
    }
  };

  if (showWelcome) {
    return renderWelcomeStep();
  }

  return (
    <Box className="onboarding-container">
      <Box className="onboarding-header">
        <Typography variant="h4" className="onboarding-title">
          Welcome to Authentic Internet
        </Typography>
        <IconButton onClick={handleSkip} className="skip-button">
          <Close />
        </IconButton>
      </Box>

      <Stepper activeStep={activeStep} className="onboarding-stepper">
        {steps.map((step, index) => (
          <Step key={index}>
            <StepLabel icon={step.icon}>
              <Typography variant="caption">{step.title}</Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box className="onboarding-content">{renderStepContent()}</Box>

      {!showWelcome && activeStep < steps.length - 1 && activeStep !== 2 && (
        <Box className="onboarding-actions">
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            className="back-button"
          >
            <ArrowBack />
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            className="next-button"
          >
            Next
            <ArrowForward />
          </Button>
        </Box>
      )}

      {/* Inspiration Modal */}
      <Dialog
        open={showInspirationModal}
        onClose={() => setShowInspirationModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedInspiration?.title}
          <IconButton
            onClick={() => setShowInspirationModal(false)}
            className="close-button"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" className="inspiration-modal-description">
            {selectedInspiration?.description}
          </Typography>
          <Typography variant="h6" className="inspiration-examples-title">
            Example Artifacts:
          </Typography>
          <Grid container spacing={2}>
            {selectedInspiration?.examples.map((example, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card className="example-card">
                  <CardContent>
                    <Box className="example-header">
                      <Chip label={example.type} size="small" />
                      <Typography variant="h6">{example.title}</Typography>
                    </Box>
                    <Typography variant="body2">
                      {example.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInspirationModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleInspirationConfirm}>
            Use This Inspiration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OnboardingFlow;
