import React, { useState, useEffect, useCallback, useRef } from "react";
import "./HamletFinale.css";

/**
 * Hamlet Finale - A dramatic mini-game recreation of Hamlet's final scene
 * The duel with Claudius, featuring poison sword and poison chalice
 */
const HamletFinale = ({ onComplete, onExit }) => {
  const [gameState, setGameState] = useState("intro"); // intro, duel, poison_choice, finale, complete
  const [playerHealth, setPlayerHealth] = useState(100);
  const [claudiusHealth, setClaudiusHealth] = useState(100);
  const [hasPoisonSword, setHasPoisonSword] = useState(false);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [roundCount, setRoundCount] = useState(0);
  const canvasRef = useRef(null);

  const introDialogue = [
    "CLAUDIUS: Come, Hamlet, come and take this sword from me.",
    "LAERTES: Come, one for me... (whispers) The sword is envenomed!",
    "HAMLET: Then I shall prove my mettle in this duel.",
    "⚔️ THE DUEL BEGINS ⚔️",
  ];

  const poisonChoiceDialogue = [
    "GERTRUDE: The cup! I will drink to Hamlet's fortune!",
    "CLAUDIUS: Gertrude, do not drink!",
    "GERTRUDE: (drinks) I will, my lord; I pray you, pardon me.",
    "⚠️ THE QUEEN HAS BEEN POISONED ⚠️",
  ];

  const finaleDialogue = [
    "HAMLET: The point envenomed too! Then, venom, to thy work!",
    "CLAUDIUS: O, yet defend me, friends; I am but hurt!",
    "HAMLET: Here, thou incestuous, murderous, damned Dane!",
    "Drink off this potion! Follow my mother!",
    "🗡️ CLAUDIUS FALLS 🗡️",
  ];

  useEffect(() => {
    // Draw simple battle scene
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw floor
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, 300, canvas.width, 200);

    // Draw Hamlet (left)
    ctx.fillStyle = hasPoisonSword ? "#8B008B" : "#000080";
    ctx.fillRect(100, 200, 60, 100);
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(110, 210, 40, 20); // Crown

    // Draw Claudius (right)
    ctx.fillStyle = "#8B0000";
    ctx.fillRect(540, 200, 60, 100);
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(550, 210, 40, 20); // Crown

    // Draw health bars
    ctx.fillStyle = "#000";
    ctx.fillRect(50, 150, 154, 24);
    ctx.fillStyle = "#00FF00";
    ctx.fillRect(52, 152, (playerHealth / 100) * 150, 20);

    ctx.fillStyle = "#000";
    ctx.fillRect(496, 150, 154, 24);
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(498, 152, (claudiusHealth / 100) * 150, 20);

    // Draw names
    ctx.fillStyle = "#FFF";
    ctx.font = '14px "Press Start 2P"';
    ctx.fillText("HAMLET", 50, 145);
    ctx.fillText("CLAUDIUS", 496, 145);
  }, [playerHealth, claudiusHealth, hasPoisonSword]);

  const handleDialogueAdvance = () => {
    if (gameState === "intro") {
      if (dialogueIndex < introDialogue.length - 1) {
        setDialogueIndex(dialogueIndex + 1);
      } else {
        setGameState("duel");
        setDialogueIndex(0);
      }
    } else if (gameState === "poison_choice") {
      if (dialogueIndex < poisonChoiceDialogue.length - 1) {
        setDialogueIndex(dialogueIndex + 1);
      } else {
        setHasPoisonSword(true);
        setGameState("duel");
        setDialogueIndex(0);
      }
    } else if (gameState === "finale") {
      if (dialogueIndex < finaleDialogue.length - 1) {
        setDialogueIndex(dialogueIndex + 1);
      } else {
        setGameState("complete");
      }
    }
  };

  const handleAttack = useCallback(() => {
    if (!isPlayerTurn || gameState !== "duel") return;

    const damage = hasPoisonSword ? 30 : 20;
    const newClaudiusHealth = Math.max(0, claudiusHealth - damage);
    setClaudiusHealth(newClaudiusHealth);
    setIsPlayerTurn(false);
    setRoundCount((prev) => prev + 1);

    // Claudius counterattack
    setTimeout(() => {
      const counterDamage = Math.random() > 0.5 ? 15 : 25;
      setPlayerHealth((prev) => Math.max(0, prev - counterDamage));
      setIsPlayerTurn(true);
    }, 1500);

    // Trigger poison choice after round 3
    if (roundCount === 2 && !hasPoisonSword) {
      setTimeout(() => {
        setGameState("poison_choice");
        setDialogueIndex(0);
      }, 2000);
    }

    // Check for victory
    if (newClaudiusHealth <= 0) {
      setTimeout(() => {
        setGameState("finale");
        setDialogueIndex(0);
      }, 1500);
    }
  }, [isPlayerTurn, gameState, hasPoisonSword, claudiusHealth, roundCount]);

  const handleParry = useCallback(() => {
    if (!isPlayerTurn || gameState !== "duel") return;

    // Parry successful - no damage taken
    setIsPlayerTurn(false);
    setRoundCount((prev) => prev + 1);

    setTimeout(() => {
      // Claudius attacks but we parry
      setIsPlayerTurn(true);
    }, 1500);

    // Trigger poison choice after round 3
    if (roundCount === 2 && !hasPoisonSword) {
      setTimeout(() => {
        setGameState("poison_choice");
        setDialogueIndex(0);
      }, 2000);
    }
  }, [isPlayerTurn, gameState, roundCount, hasPoisonSword]);

  const handleComplete = () => {
    if (onComplete) {
      onComplete({
        success: true,
        reward: "Wand of Prospero",
        exp: 100,
      });
    }
  };

  const getCurrentDialogue = () => {
    if (gameState === "intro") return introDialogue[dialogueIndex];
    if (gameState === "poison_choice")
      return poisonChoiceDialogue[dialogueIndex];
    if (gameState === "finale") return finaleDialogue[dialogueIndex];
    return "";
  };

  return (
    <div className="hamlet-finale-container">
      <div className="hamlet-header">
        <h2>⚔️ THE TRAGEDY OF HAMLET, PRINCE OF DENMARK ⚔️</h2>
        <h3>Act V, Scene II - The Final Duel</h3>
      </div>

      <div className="hamlet-stage">
        <canvas
          ref={canvasRef}
          width={700}
          height={500}
          className="hamlet-canvas"
        />
      </div>

      {(gameState === "intro" ||
        gameState === "poison_choice" ||
        gameState === "finale") && (
        <div className="hamlet-dialogue-box">
          <p className="dialogue-text">{getCurrentDialogue()}</p>
          <button className="dialogue-btn" onClick={handleDialogueAdvance}>
            {gameState === "finale" &&
            dialogueIndex === finaleDialogue.length - 1
              ? "Complete Quest"
              : "Continue →"}
          </button>
        </div>
      )}

      {gameState === "duel" && (
        <div className="hamlet-controls">
          <div className="status-text">
            {isPlayerTurn ? "Your Turn!" : "Claudius attacks..."}
            {hasPoisonSword && (
              <span className="poison-indicator"> [POISON BLADE] </span>
            )}
          </div>
          <div className="action-buttons">
            <button
              className="action-btn attack-btn"
              onClick={handleAttack}
              disabled={!isPlayerTurn}
            >
              🗡️ THRUST
            </button>
            <button
              className="action-btn parry-btn"
              onClick={handleParry}
              disabled={!isPlayerTurn}
            >
              🛡️ PARRY
            </button>
          </div>
        </div>
      )}

      {gameState === "complete" && (
        <div className="hamlet-complete">
          <h2>🎭 QUEST COMPLETE 🎭</h2>
          <p className="complete-text">"The rest is silence..."</p>
          <p className="reward-text">
            You have been bestowed the{" "}
            <span className="highlight">Wand of Prospero</span>!
          </p>
          <p className="reward-description">
            A magical staff that can conjure storms and bend reality itself.
          </p>
          <div className="complete-actions">
            <button className="complete-btn primary" onClick={handleComplete}>
              ⚔️ Claim Reward
            </button>
            <button className="complete-btn secondary" onClick={onExit}>
              Exit
            </button>
          </div>
        </div>
      )}

      <button className="exit-btn" onClick={onExit}>
        ✕ Exit
      </button>
    </div>
  );
};

export default HamletFinale;
