import React, { useState } from "react";
import OnboardingGuide from "../components/OnboardingGuide";
import Button from "../components/shared/Button";

const OnboardingTest = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleComplete = () => {
    setShowOnboarding(false);
    alert("Onboarding completed! Welcome to Authentic Internet!");
  };

  const handleSkip = () => {
    setShowOnboarding(false);
    alert("Onboarding skipped. You can always access it later.");
  };

  return (
    <div
      style={{
        padding: "20px",
        textAlign: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h1 style={{ color: "white", marginBottom: "20px" }}>
        Onboarding Guide Test
      </h1>

      <p style={{ color: "white", marginBottom: "30px", maxWidth: "600px" }}>
        This page allows you to test the new onboarding guide featuring Rob as
        the world guide. Click the button below to start the immersive
        onboarding experience.
      </p>

      <Button
        onClick={() => setShowOnboarding(true)}
        style={{
          background: "white",
          color: "#667eea",
          padding: "15px 30px",
          fontSize: "18px",
          fontWeight: "bold",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
        }}
      >
        Start Onboarding Experience
      </Button>

      {showOnboarding && (
        <OnboardingGuide onComplete={handleComplete} onSkip={handleSkip} />
      )}
    </div>
  );
};

export default OnboardingTest;
