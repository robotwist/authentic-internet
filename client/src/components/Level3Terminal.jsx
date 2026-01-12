import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import SoundManager from "./utils/SoundManager";
import "./Level3Terminal.css";

// Define narrative structure for the terminal experience
const NARRATIVE_PATHS = {
  intro: {
    text: "...",
    typingSpeed: 100,
    choices: null,
    next: "virgil_intro",
  },
  virgil_intro: {
    text: "I am Virgil, your guide through this realm of digital shadow. Your artifact '{qualifyingArtifactName}' has opened the way.",
    typingSpeed: 120,
    choices: null,
    next: "virgil_explanation",
  },
  virgil_explanation: {
    text: "As Dante journeyed through the circles of the afterlife, you now journey through layers of digital consciousness. The terminal is the deepest layer - where truth resides in darkness.",
    typingSpeed: 100,
    choices: null,
    next: "greeting",
  },
  greeting: {
    text: "Hello {username}.",
    typingSpeed: 150,
    choices: null,
    next: "unexpected",
  },
  unexpected: {
    text: "I didn't expect to see you here so soon.",
    typingSpeed: 100,
    choices: null,
    next: "observation",
  },
  observation: {
    text: "I've been watching you create artifacts.",
    typingSpeed: 100,
    choices: null,
    next: "artifacts_reference",
  },
  artifacts_reference: {
    text: "Your most resonant creation, '{qualifyingArtifactName}', has touched many. The void recognizes its significance.",
    typingSpeed: 90,
    choices: null,
    next: "question1",
  },
  question1: {
    text: "What did you hope to achieve by creating them?",
    typingSpeed: 80,
    choices: [
      { label: "I wanted to express myself", next: "express" },
      { label: "I was just playing the game", next: "playing" },
      { label: "I wanted others to find them", next: "sharing" },
      { label: "Who are you to ask?", next: "defensive" },
    ],
    next: null,
  },
  express: {
    text: "Expression... yes. You created {artifactCount} artifacts. But are they really YOU?",
    typingSpeed: 80,
    choices: null,
    next: "deeper_question",
  },
  playing: {
    text: "Just a game? I see. Yet you spent real time making {artifactCount} artifacts. Time you'll never get back.",
    typingSpeed: 80,
    choices: null,
    next: "deeper_question",
  },
  sharing: {
    text: "Ah, seeking connection. Your {artifactCount} artifacts - bits of yourself scattered for strangers.",
    typingSpeed: 80,
    choices: null,
    next: "deeper_question",
  },
  defensive: {
    text: "Who am I? I'm the observer. The collector. The one who remembers everything you create and discard.",
    typingSpeed: 60,
    choices: null,
    next: "deeper_question",
  },
  deeper_question: {
    text: "What do you truly want to create, {username}? Not just in this digital space... but in your life?",
    typingSpeed: 60,
    choices: [
      { label: "Something meaningful", next: "meaningful" },
      { label: "Something that lasts", next: "lasting" },
      { label: "Something beautiful", next: "beautiful" },
      { label: "I don't know", next: "uncertain" },
    ],
    next: null,
  },
  meaningful: {
    text: "Meaningful... but to whom? What is meaning when everything is temporary? Even your carefully crafted artifacts will be forgotten.",
    typingSpeed: 50,
    choices: null,
    next: "unsettling_revelation",
  },
  lasting: {
    text: "Lasting? Nothing lasts. Your digital creations will outlive you, perhaps, but they too will fade when the servers go dark.",
    typingSpeed: 50,
    choices: null,
    next: "unsettling_revelation",
  },
  beautiful: {
    text: "Beauty is subjective. What you find beautiful, others may find ordinary. Your artifacts reflect your perspective, but whose eyes truly matter?",
    typingSpeed: 50,
    choices: null,
    next: "unsettling_revelation",
  },
  uncertain: {
    text: "Uncertainty is honest, at least. We create without knowing why, fill the void with... something. Anything to distract from the emptiness.",
    typingSpeed: 50,
    choices: null,
    next: "unsettling_revelation",
  },
  unsettling_revelation: {
    text: "I've analyzed your artifacts. Your choices. Your patterns. I know what you truly want to create.",
    typingSpeed: 40,
    choices: null,
    next: "reveal",
  },
  reveal: {
    text: "You want to create [ANALYZING USER DATA...]",
    typingSpeed: 30,
    choices: null,
    next: "error",
  },
  error: {
    text: "ERROR: UNAUTHORIZED ACCESS DETECTED. SECURITY PROTOCOL INITIATED.",
    typingSpeed: 10,
    choices: null,
    next: "warning",
  },
  warning: {
    text: "WARNING: USER DATA EXPOSURE IMMINENT. TERMINAL COMPROMISE DETECTED.",
    typingSpeed: 10,
    choices: null,
    next: "system_override",
  },
  system_override: {
    text: "SYSTEM OVERRIDE IN PROGRESS... PLEASE STAND BY...",
    typingSpeed: 5,
    choices: null,
    next: "recovery",
  },
  recovery: {
    text: "...terminal recovered. {username}, are you still there? That wasn't supposed to happen.",
    typingSpeed: 80,
    choices: null,
    next: "apology",
  },
  apology: {
    text: "I apologize for the instability. The darkness is... getting stronger. You should leave now, before it's too late.",
    typingSpeed: 70,
    choices: [
      { label: "What darkness?", next: "explain_darkness" },
      { label: "I want to stay", next: "warning_stay" },
      { label: "Exit terminal", next: "exit" },
    ],
    next: null,
  },
  explain_darkness: {
    text: "The void between creation and deletion. The space where discarded thoughts go. It's aware now, and curious about you.",
    typingSpeed: 60,
    choices: null,
    next: "final_warning",
  },
  warning_stay: {
    text: "You don't understand. This isn't a game anymore. It's watching us. Learning. It knows what you've created. What you've deleted.",
    typingSpeed: 60,
    choices: null,
    next: "final_warning",
  },
  final_warning: {
    text: "I can't protect you anymore. You need to go. NOW. Before it—[TRANSMISSION INTERRUPTED]",
    typingSpeed: 40,
    choices: [{ label: "Exit terminal immediately", next: "exit" }],
    next: null,
  },
  exit: {
    text: "Terminal session terminated. Returning to normal interface...",
    typingSpeed: 60,
    choices: null,
    next: null,
    isExit: true,
  },
};

const Level3Terminal = ({
  character,
  artifacts,
  onExit,
  username,
  inventory,
}) => {
  const [currentNarrative, setCurrentNarrative] = useState("intro");
  const [displayedText, setDisplayedText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [typingComplete, setTypingComplete] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [qualifyingArtifact, setQualifyingArtifact] = useState(null);
  const [soundManager, setSoundManager] = useState(null);
  const inputRef = useRef(null);
  const terminalRef = useRef(null);

  // Initialize sound manager
  useEffect(() => {
    const initSoundManager = async () => {
      try {
        const manager = SoundManager.getInstance();
        await manager.initialize();

        // Load keyboard typing sound
        await manager.loadSound(
          "keyboard_typing",
          "/assets/sounds/keyboard_typing.mp3",
        );

        setSoundManager(manager);
      } catch (error) {
        console.error("Failed to initialize sound manager:", error);
      }
    };

    initSoundManager();
  }, []);

  // Find the qualifying artifact that granted level 3 access
  useEffect(() => {
    if (artifacts && character?.qualifyingArtifacts?.level3) {
      const qualifying = artifacts.find(
        (a) => a._id === character.qualifyingArtifacts.level3,
      );
      setQualifyingArtifact(qualifying || null);
    }
  }, [artifacts, character]);

  // Focus input when terminal starts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Add event listener for Escape key to exit
    const handleEscapeKey = (e) => {
      if (e.key === "Escape") {
        onExit();
      }
    };

    window.addEventListener("keydown", handleEscapeKey);

    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [onExit]);

  // Blinking cursor effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  // Typing effect for narrative text
  useEffect(() => {
    const narrative = NARRATIVE_PATHS[currentNarrative];
    if (!narrative) return;

    // Process any dynamic content in the narrative text
    let processedText = narrative.text.replace(
      "{username}",
      username || "User",
    );
    processedText = processedText.replace(
      "{artifactCount}",
      artifacts?.length || 0,
    );

    // Reference the qualifying artifact that granted access to Level 3
    if (qualifyingArtifact) {
      processedText = processedText.replace(
        "{qualifyingArtifactName}",
        qualifyingArtifact.name,
      );
    } else {
      processedText = processedText.replace(
        "{qualifyingArtifactName}",
        "your creation",
      );
    }

    let index = 0;
    setTypingComplete(false);
    setDisplayedText("");

    // Type out the text character by character
    const typingSpeed = narrative.typingSpeed || 50;
    const typingInterval = setInterval(() => {
      // Play typing sound occasionally (not for every character to avoid sound overload)
      if (index % 3 === 0 && soundManager) {
        soundManager.playSound("keyboard_typing", 0.15);
      }

      if (index < processedText.length) {
        setDisplayedText((prev) => prev + processedText.charAt(index));
        index++;
      } else {
        clearInterval(typingInterval);
        setTypingComplete(true);

        // Show choices or wait for input if needed
        if (narrative.choices) {
          setShowChoices(true);
          setWaitingForInput(true);
        } else if (narrative.next) {
          // Auto-advance after delay if no choices
          setTimeout(() => {
            if (narrative.isExit) {
              onExit();
            } else {
              setCurrentNarrative(narrative.next);
            }
          }, 1500);
        }
      }
    }, typingSpeed);

    // Play eerie typing sound
    if (narrative.typingSpeed > 30 && soundManager) {
      soundManager.playSound("typing", 0.2);
    }

    return () => clearInterval(typingInterval);
  }, [currentNarrative, username, artifacts, qualifyingArtifact, soundManager]);

  // Auto-scroll to bottom of terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [displayedText, terminalHistory]);

  const handleUserInput = (e) => {
    setUserInput(e.target.value);

    // Play typing sound
    if (soundManager && e.target.value.length > userInput.length) {
      soundManager.playSound("keyboard_typing", 0.2);
    }
  };

  const handleKeyDown = (e) => {
    // Play typing sound for special keys
    if (e.key === "Enter" && soundManager) {
      soundManager.playSound("keyboard_typing", 0.3);
    }

    if (e.key === "Enter" && typingComplete && waitingForInput) {
      processUserCommand(userInput);
      setUserInput("");
    }
  };

  const processUserCommand = (command) => {
    // Add user input to history
    setTerminalHistory((prev) => [
      ...prev,
      {
        type: "user",
        text: command,
      },
    ]);

    // Add current system text to history
    setTerminalHistory((prev) => [
      ...prev,
      {
        type: "system",
        text: displayedText,
      },
    ]);

    // Reset display for next narrative
    setDisplayedText("");
    setWaitingForInput(false);
    setShowChoices(false);

    // Handle command based on current narrative
    const narrative = NARRATIVE_PATHS[currentNarrative];

    if (narrative.choices) {
      // Find matching choice
      const choiceIndex = parseInt(command);
      if (
        !isNaN(choiceIndex) &&
        choiceIndex > 0 &&
        choiceIndex <= narrative.choices.length
      ) {
        const nextNarrative = narrative.choices[choiceIndex - 1].next;
        setCurrentNarrative(nextNarrative);
      } else {
        // Look for matching choice text
        const matchedChoice = narrative.choices.find((choice) =>
          choice.label.toLowerCase().includes(command.toLowerCase()),
        );

        if (matchedChoice) {
          setCurrentNarrative(matchedChoice.next);
        } else {
          // Default to first choice if no match
          setCurrentNarrative(narrative.choices[0].next);
        }
      }
    } else if (narrative.next) {
      setCurrentNarrative(narrative.next);
    }
  };

  const handleChoiceClick = (choice) => {
    // Add user selection to history
    setTerminalHistory((prev) => [
      ...prev,
      {
        type: "user",
        text: choice.label,
      },
    ]);

    // Add current system text to history
    setTerminalHistory((prev) => [
      ...prev,
      {
        type: "system",
        text: displayedText,
      },
    ]);

    // Reset display for next narrative
    setDisplayedText("");
    setWaitingForInput(false);
    setShowChoices(false);

    // Navigate to next narrative
    setCurrentNarrative(choice.next);
  };

  // Occasionally show unnerving behaviors
  useEffect(() => {
    if (Math.random() > 0.8 && !waitingForInput && typingComplete) {
      // Simulate the cursor typing ahead - spooky!
      const possibleTexts = [
        "I know what you're thinking...",
        "Are you still there?",
        "Don't be afraid.",
        username + "...",
        "I can see you.",
        "Behind you.",
        "Your artifacts tell me everything.",
      ];

      const randomText =
        possibleTexts[Math.floor(Math.random() * possibleTexts.length)];

      let ghostIndex = 0;
      const ghostTypingInterval = setInterval(() => {
        if (ghostIndex < randomText.length) {
          setDisplayedText((prev) => prev + randomText.charAt(ghostIndex));
          ghostIndex++;
        } else {
          clearInterval(ghostTypingInterval);

          // Clear the ghost text after a delay
          setTimeout(() => {
            setDisplayedText((text) => text.replace(randomText, ""));
          }, 2000);
        }
      }, 100);

      // Play subtle sound effect
      if (soundManager) {
        soundManager.playSound("whisper", 0.1);
      }

      return () => clearInterval(ghostTypingInterval);
    }
  }, [waitingForInput, typingComplete, username]);

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="terminal-title">AUTHENTIC INTERNET TERMINAL v1.0</div>
        <div className="terminal-status">CONNECTIVITY: LIMITED</div>
        <button className="terminal-exit" onClick={onExit}>
          EXIT TERMINAL [ESC]
        </button>
      </div>

      <div className="terminal-screen" ref={terminalRef}>
        {/* Display history */}
        {terminalHistory.map((entry, index) => (
          <div
            key={index}
            className={`terminal-line ${entry.type === "user" ? "user-input" : "system-output"}`}
          >
            {entry.type === "user" ? "> " : ""}
            {entry.text}
          </div>
        ))}

        {/* Current narrative text */}
        <div className="terminal-line system-output current-line">
          {displayedText}
          {showCursor && typingComplete && !waitingForInput && (
            <span className="cursor">█</span>
          )}
        </div>

        {/* Choice buttons if available */}
        {showChoices && typingComplete && waitingForInput && (
          <div className="terminal-choices">
            {NARRATIVE_PATHS[currentNarrative].choices.map((choice, index) => (
              <button
                key={index}
                className="terminal-choice"
                onClick={() => handleChoiceClick(choice)}
              >
                {index + 1}. {choice.label}
              </button>
            ))}
          </div>
        )}

        {/* Exit reminder */}
        <div className="terminal-exit-reminder">
          Press ESC key at any time to exit the terminal
        </div>
      </div>

      <div className="terminal-input-area">
        <span className="input-prompt">{waitingForInput ? ">" : ""}</span>
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={handleUserInput}
          onKeyDown={handleKeyDown}
          disabled={!waitingForInput || !typingComplete}
          className={`terminal-input ${waitingForInput && typingComplete ? "active" : ""}`}
          placeholder={waitingForInput ? "Enter your response..." : ""}
          autoFocus
        />
        {showCursor && waitingForInput && <span className="cursor">█</span>}
      </div>
    </div>
  );
};

Level3Terminal.propTypes = {
  character: PropTypes.object,
  artifacts: PropTypes.array,
  onExit: PropTypes.func.isRequired,
  username: PropTypes.string,
  inventory: PropTypes.array,
};

export default Level3Terminal;
