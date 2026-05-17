import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Button from "./shared/Button";
import "../styles/OnboardingGuide.css";

const ROB_GUIDE_AVATAR = "/assets/npcs/guide.png";

const OnboardingGuide = ({ onComplete, onSkip }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [showChoices, setShowChoices] = useState(false);

  const steps = [
    {
      id: "welcome",
      title: "Welcome, Explorer",
      content: `Welcome, ${user?.username || "explorer"}! You've entered a world where creativity and discovery meet. Here you can create games, stories, art, and puzzles - or explore what others have made.`,
      choices: [
        "What can I do here?",
        "How do I start?",
        "Let's go!",
      ],
    },
    {
      id: "getting-started",
      title: "Your Adventure Begins",
      content: `Explore the world to find NPCs who will guide you, grant you items and powers, and help you on your journey. Create artifacts to share with others. Earn experience and unlock new abilities. The world is yours to discover.`,
      choices: [
        "I'm ready to explore!",
        "Tell me more about artifacts",
        "Let's start!",
      ],
    },
    {
      id: "ready",
      title: "Ready to Begin",
      content: `Use arrow keys or WASD to move, interact with NPCs and items you find, and create your own content to share. Good luck on your journey!`,
      choices: [
        "Start Adventure",
        "I'm ready!",
      ],
    },
  ];

  const typeText = (text, onComplete) => {
    setIsTyping(true);
    setDisplayedText("");
    let index = 0;

    const typeInterval = setInterval(() => {
      if (index < text.length) {
        const nextCharacter = text[index];
        setDisplayedText((prev) => prev + nextCharacter);
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

    // Simplified flow: always move to next step or complete
    let nextStep = currentStep + 1;

    // On final step, complete the onboarding
    if (currentStep === 2 || choice.includes("Start") || choice.includes("ready")) {
      onComplete?.();
      return;
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
          <img className="avatar-image" src={ROB_GUIDE_AVATAR} alt="Rob" />
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
