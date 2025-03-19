import React, { useState, useEffect } from 'react';
import { getRandomShakespeareQuote } from '../api/externalApis';
import ArtifactCreation from './ArtifactCreation';
import './WorldGuideOnboarding.css';

const WorldGuideOnboarding = ({ 
  onClose, 
  onComplete, 
  characterPosition, 
  isLoggedIn,
  username
}) => {
  const [step, setStep] = useState(0);
  const [quote, setQuote] = useState("");
  const [showArtifactForm, setShowArtifactForm] = useState(false);
  const [artifactCreated, setArtifactCreated] = useState(false);
  
  // Fetch a Shakespeare quote on component mount
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await getRandomShakespeareQuote();
        setQuote(response.text || "To be, or not to be, that is the question.");
      } catch (error) {
        console.error("Error fetching Shakespeare quote:", error);
        setQuote("To be, or not to be, that is the question.");
      }
    };
    
    fetchQuote();
  }, []);
  
  const steps = [
    {
      title: "Welcome to Authentic Internet",
      content: (
        <div>
          <p className="guide-text">Greetings, {username || 'traveler'}! I am Shakespeare, your World Guide.</p>
          <p className="shakespeare-quote">"{quote}"</p>
          <p className="guide-text">I shall guide you on your journey to create your first artifact that others may discover and interact with.</p>
        </div>
      )
    },
    {
      title: "The Power of Creation",
      content: (
        <div>
          <p className="guide-text">In this world, you shall create artifacts of wisdom and wit that others may find and cherish.</p>
          <p className="guide-text">With each interaction your artifact receives, you shall earn experience points to create more artifacts and unlock new realms.</p>
          <p className="guide-text">Are you ready to create your first artifact?</p>
        </div>
      )
    },
    {
      title: "Create Your First Artifact",
      content: (
        <div>
          {!showArtifactForm ? (
            <div>
              <p className="guide-text">Let us create your first artifact together. It will be placed at your current location in the world.</p>
              <p className="guide-text">Others who visit this location will find your creation and interact with it, earning you experience.</p>
              <button 
                className="guide-button" 
                onClick={() => setShowArtifactForm(true)}
              >
                Create My First Artifact
              </button>
            </div>
          ) : (
            artifactCreated ? (
              <div>
                <p className="guide-text">Magnificent! Your artifact has been placed in the world.</p>
                <p className="guide-text">When others interact with it, you will earn experience points.</p>
                <p className="guide-text">Return to me when you have earned enough experience to create another artifact.</p>
              </div>
            ) : (
              <ArtifactCreation 
                position={characterPosition}
                onSuccess={() => {
                  setArtifactCreated(true);
                  // Trigger any additional success logic needed
                }}
                onCancel={() => setShowArtifactForm(false)}
                isFirstArtifact={true}
              />
            )
          )}
        </div>
      )
    }
  ];
  
  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else if (artifactCreated) {
      // Call onComplete when all steps are done and the artifact has been created
      onComplete && onComplete();
    }
  };
  
  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };
  
  if (!isLoggedIn) {
    return (
      <div className="world-guide-backdrop">
        <div className="world-guide-modal">
          <h2>Authentication Required</h2>
          <p>You must be logged in to create artifacts.</p>
          <button onClick={onClose} className="guide-button">
            Close
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="world-guide-backdrop">
      <div className="world-guide-modal">
        <div className="world-guide-header">
          <h2>{steps[step].title}</h2>
          <div className="shakespeare-portrait"></div>
        </div>
        
        <div className="world-guide-content">
          {steps[step].content}
        </div>
        
        <div className="world-guide-footer">
          {step > 0 && !showArtifactForm && (
            <button onClick={handleBack} className="guide-button back">
              Back
            </button>
          )}
          
          {(step < steps.length - 1 || artifactCreated) && !showArtifactForm && (
            <button onClick={handleNext} className="guide-button next">
              {step === steps.length - 1 && artifactCreated ? 'Complete' : 'Next'}
            </button>
          )}
          
          <button onClick={onClose} className="guide-button close">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorldGuideOnboarding; 