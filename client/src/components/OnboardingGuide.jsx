import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Button from "./shared/Button";
import "../styles/OnboardingGuide.css";

const OnboardingGuide = ({ onComplete, onSkip }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [showChoices, setShowChoices] = useState(false);

  const steps = [
    {
      id: "welcome",
      title: "Welcome to Authentic Internet",
      content: `Hello there, ${user?.username || "explorer"}! I'm Rob, and I'm the creator of this world you've just stepped into. But here's the thing - you haven't just entered a game. You've stepped inside the very first artifact ever created.`,
      choices: [
        "Tell me more about artifacts",
        'What do you mean by "first artifact"?',
        "How do I start exploring?",
      ],
    },
    {
      id: "artifact-explanation",
      title: "What Are Artifacts?",
      content: `Artifacts are more than just items or content - they're pieces of human creativity made interactive. They can be games, stories, puzzles, art, music, or experiences that others can discover, interact with, and build upon. Think of them as digital treasures that carry meaning and create connections.`,
      choices: [
        "So this game is an artifact?",
        "How do I create artifacts?",
        "What makes a good artifact?",
      ],
    },
    {
      id: "meta-narrative",
      title: "The Meta-Narrative",
      content: `Exactly! This entire game - Authentic Internet - is itself an artifact. It's a living, breathing example of what's possible when you think beyond traditional gaming. I created this world to show you that games can be more than entertainment - they can be platforms for creation, discovery, and authentic human connection.`,
      choices: [
        "That's fascinating!",
        "So what's my role here?",
        "How do I contribute?",
      ],
    },
    {
      id: "your-mission",
      title: "Your Mission",
      content: `Your mission is simple yet profound: create an artifact that's even better than this game itself. I want you to build something that makes people think, feel, learn, or experience something new. Something that, when someone discovers it, they'll say "This changed how I see the world."`,
      choices: [
        "That sounds amazing!",
        "I'm not sure I can do that",
        "What tools do I have?",
      ],
    },
    {
      id: "tools-and-powers",
      title: "Your Creative Arsenal",
      content: `You have access to incredible tools: create interactive stories, design puzzles, compose music, make art, build games, or combine them all. As you explore and complete artifacts, you'll unlock powers that let you reach new areas and create even more amazing things. The only limit is your imagination.`,
      choices: [
        "Show me how to start creating",
        "What powers can I unlock?",
        "I want to explore first",
      ],
    },
    {
      id: "community",
      title: "You're Not Alone",
      content: `This isn't a solo journey. You're joining a community of creators, explorers, and dreamers. Rate and review artifacts, collaborate with others, follow your favorite creators, and build collections. Every interaction makes this world richer and more meaningful.`,
      choices: [
        "I'm ready to start!",
        "Tell me about collaboration",
        "Show me the community features",
      ],
    },
    {
      id: "final-inspiration",
      title: "The Challenge",
      content: `So here's my challenge to you: Go out there and create something that makes me proud to have built this platform. Create an artifact that someone will discover years from now and think "This is why I believe in the power of human creativity." Ready to begin your journey?`,
      choices: [
        "I accept the challenge!",
        "I need a moment to think",
        "Take me to the creation tools",
      ],
    },
  ];

  const typeText = (text, onComplete) => {
    setIsTyping(true);
    setDisplayedText("");
    let index = 0;

    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text[index]);
        index++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        setShowChoices(true);
        if (onComplete) onComplete();
      }
    }, 30);
  };

  useEffect(() => {
    if (currentStep < steps.length) {
      setShowChoices(false);
      typeText(steps[currentStep].content);
    }
  }, [currentStep]);

  const handleChoice = (choice) => {
    setShowChoices(false);

    // Determine next step based on choice
    let nextStep = currentStep + 1;

    // Custom logic for specific choices
    if (currentStep === 0) {
      if (choice.includes("artifacts")) nextStep = 1;
      else if (choice.includes("first artifact")) nextStep = 2;
      else if (choice.includes("exploring")) nextStep = 4;
    } else if (currentStep === 1) {
      if (choice.includes("game is an artifact")) nextStep = 2;
      else if (choice.includes("create artifacts")) nextStep = 4;
      else if (choice.includes("good artifact")) nextStep = 3;
    } else if (currentStep === 2) {
      if (choice.includes("fascinating")) nextStep = 3;
      else if (choice.includes("role")) nextStep = 3;
      else if (choice.includes("contribute")) nextStep = 4;
    } else if (currentStep === 3) {
      if (choice.includes("amazing")) nextStep = 4;
      else if (choice.includes("not sure")) nextStep = 4;
      else if (choice.includes("tools")) nextStep = 4;
    } else if (currentStep === 4) {
      if (choice.includes("start creating")) nextStep = 6;
      else if (choice.includes("powers")) nextStep = 5;
      else if (choice.includes("explore")) nextStep = 6;
    } else if (currentStep === 5) {
      if (choice.includes("ready to start")) nextStep = 6;
      else if (choice.includes("collaboration")) nextStep = 6;
      else if (choice.includes("community")) nextStep = 6;
    } else if (currentStep === 6) {
      if (choice.includes("accept")) {
        onComplete?.();
        return;
      } else if (choice.includes("moment")) {
        nextStep = 6; // Stay on same step
      } else if (choice.includes("creation tools")) {
        onComplete?.();
        return;
      }
    }

    if (nextStep < steps.length) {
      setCurrentStep(nextStep);
    } else {
      onComplete?.();
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  if (currentStep >= steps.length) {
    return null;
  }

  const currentStepData = steps[currentStep];

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        <div className="guide-avatar">
          <div className="avatar-image">👨‍💻</div>
          <div className="guide-name">Rob</div>
          <div className="guide-title">Creator & World Guide</div>
        </div>

        <div className="dialogue-container">
          <h2 className="step-title">{currentStepData.title}</h2>

          <div className="dialogue-text">
            {displayedText}
            {isTyping && <span className="typing-cursor">|</span>}
          </div>

          {showChoices && (
            <div className="choice-container">
              {currentStepData.choices.map((choice, index) => (
                <Button
                  key={index}
                  onClick={() => handleChoice(choice)}
                  className="choice-button"
                  variant="outlined"
                >
                  {choice}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="onboarding-controls">
          <Button onClick={handleSkip} variant="text" className="skip-button">
            Skip Tutorial
          </Button>

          <div className="progress-indicator">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`progress-dot ${index === currentStep ? "active" : ""} ${index < currentStep ? "completed" : ""}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingGuide;
