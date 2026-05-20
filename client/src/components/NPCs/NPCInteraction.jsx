import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from "react";
import { AuthContext } from "../../context/AuthContext";
import SoundManager from "../utils/SoundManager";
import "./NPCInteraction.css";

/** Comic-timing delay before the next NPC character appears */
function npcCharRevealDelay(ch, shiftHeld) {
  let ms;
  if (".!?".includes(ch)) ms = 130 + Math.random() * 50;
  else if (",;:—–-".includes(ch)) ms = 58 + Math.random() * 24;
  else if (ch === "\n") ms = 90;
  else if (ch === " ") ms = 12 + Math.random() * 8;
  else ms = 16 + Math.random() * 8;
  if (shiftHeld) ms *= 0.3;
  return Math.max(6, Math.round(ms));
}

const NPC_API_TIMEOUT_MS = 3500;

function npcApiFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), NPC_API_TIMEOUT_MS);
  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => window.clearTimeout(timeout));
}

const NPCInteraction = ({ npc, onClose, context = {}, embedded = false }) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [relationship, setRelationship] = useState("stranger");
  const [interactionCount, setInteractionCount] = useState(0);
  const [currentQuest, setCurrentQuest] = useState(null);
  const [npcState, setNpcState] = useState({
    mood: "neutral",
    knowledge: [],
  });
  const [revealNpcIndex, setRevealNpcIndex] = useState(null);
  const [revealNpcLen, setRevealNpcLen] = useState(0);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const shiftFastRef = useRef(false);
  const lastBlurbAtRef = useRef(0);
  const usesLocalDialogue = Array.isArray(npc.dialogue) && npc.dialogue.length > 0;

  useEffect(() => {
    if (embedded) {
      setRevealNpcIndex(null);
      return;
    }
    const last = messages[messages.length - 1];
    if (last?.type === "npc") {
      setRevealNpcIndex(messages.length - 1);
      setRevealNpcLen(0);
    } else {
      setRevealNpcIndex(null);
    }
  }, [messages, embedded]);

  useEffect(() => {
    if (revealNpcIndex === null) return;
    const msg = messages[revealNpcIndex];
    if (!msg || msg.type !== "npc") {
      setRevealNpcIndex(null);
      return;
    }
    const full = msg.text;
    if (revealNpcLen >= full.length) {
      setRevealNpcIndex(null);
      return;
    }

    const ch = full[revealNpcLen];
    const delay = npcCharRevealDelay(ch, shiftFastRef.current);
    const id = window.setTimeout(() => {
      const now = performance.now();
      if (/[A-Za-z0-9]/.test(ch) && now - lastBlurbAtRef.current > 120) {
        lastBlurbAtRef.current = now;
        try {
          SoundManager.getInstance().playNpcDialogBlurb(0.16);
        } catch {
          // Dialogue should keep flowing even if the browser refuses audio.
        }
      }
      setRevealNpcLen((n) => n + 1);
    }, delay);

    return () => clearTimeout(id);
  }, [revealNpcIndex, revealNpcLen, messages]);

  useEffect(() => {
    const onShiftDown = (e) => {
      if (e.key === "Shift") shiftFastRef.current = true;
    };
    const onShiftUp = (e) => {
      if (e.key === "Shift") shiftFastRef.current = false;
    };
    window.addEventListener("keydown", onShiftDown);
    window.addEventListener("keyup", onShiftUp);
    return () => {
      window.removeEventListener("keydown", onShiftDown);
      window.removeEventListener("keyup", onShiftUp);
    };
  }, []);

  const skipNpcReveal = useCallback(() => {
    setRevealNpcIndex((idx) => {
      if (idx == null) return null;
      const m = messagesRef.current[idx];
      if (m?.type === "npc") setRevealNpcLen(m.text.length);
      return null;
    });
  }, []);

  useEffect(() => {
    if (revealNpcIndex === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") return;
      if (e.key === "Shift") return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        skipNpcReveal();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [revealNpcIndex, skipNpcReveal]);

  const localNpcMessage = (text) => ({
    type: "npc",
    text: text || npc.dialogue?.[0] || "Hello there, traveler!",
    author: npc.name,
    timestamp: new Date(),
  });

  const getFallbackDialogueResponse = () => {
    const npcLineCount = messagesRef.current.filter((m) => m.type === "npc").length;
    const dialogueIndex = npcLineCount % (npc.dialogue?.length || 1);
    return localNpcMessage(
      npc.dialogue?.[dialogueIndex] ||
        "Thank you for sharing that with me.",
    );
  };

  const initializeConversation = async () => {
    // Always greet locally first so production API slowness never creates a dead conversation.
    setMessages([localNpcMessage()]);

    if (usesLocalDialogue || !npc._id || !npc._id.trim()) {
      console.log("Using fallback dialogue for NPC:", npc.name);
      return;
    }

    try {
      const response = await npcApiFetch(`/api/npcs/${npc._id}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "",
          userId: user?._id,
          context: {
            location: context.area || "overworld",
            weather: context.weather || "sunny",
            timeOfDay:
              new Date().getHours() < 12
                ? "morning"
                : new Date().getHours() < 18
                  ? "afternoon"
                  : "evening",
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages([
          {
            type: "npc",
            text: data.response.text,
            author: data.response.author,
            timestamp: new Date(),
          },
        ]);

        setRelationship(data.response.relationship || "stranger");
        setInteractionCount(data.response.context?.interactionCount || 0);

        // Check for available quests
        if (data.response.availableQuests) {
          setCurrentQuest(data.response.availableQuests[0]);
        }
      } else {
        // Fallback to dialogue if API response not successful
        throw new Error("API response not successful");
      }
    } catch (error) {
      console.log("Keeping local greeting due to API error:", error.message);
    }
  };

  useEffect(() => {
    initializeConversation();
  }, [npc]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      type: "user",
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Local map NPCs have authored dialogue and should not depend on backend NPC records.
    if (usesLocalDialogue || !npc._id || !npc._id.trim()) {
      console.log("Using fallback dialogue for NPC response");
      setTimeout(() => {
        setMessages((prev) => [...prev, getFallbackDialogueResponse()]);
        setIsLoading(false);
        setInput("");
        setInteractionCount((prev) => prev + 1);
      }, 500); // Simulate thinking delay
      return;
    }

    try {
      const response = await npcApiFetch(`/api/npcs/${npc._id}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          userId: user?._id,
          context: {
            location: context.area || "overworld",
            weather: context.weather || "sunny",
            timeOfDay:
              new Date().getHours() < 12
                ? "morning"
                : new Date().getHours() < 18
                  ? "afternoon"
                  : "evening",
            previousMessages: messages.slice(-5), // Send last 5 messages for context
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        const npcResponse = {
          type: "npc",
          text: data.response.text,
          author: data.response.author,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, npcResponse]);
        setRelationship(data.response.relationship || relationship);
        setInteractionCount(
          data.response.context?.interactionCount || interactionCount + 1,
        );

        // Update quest status if applicable
        if (data.response.questUpdate) {
          setCurrentQuest(data.response.questUpdate);
        }

        // Update NPC state based on response
        if (data.response.mood) {
          setNpcState((prev) => ({
            ...prev,
            mood: data.response.mood,
          }));
        }
      } else {
        // Fallback to dialogue
        throw new Error("API response not successful");
      }
    } catch (error) {
      console.log("Using fallback dialogue due to API error:", error.message);
      setMessages((prev) => [...prev, getFallbackDialogueResponse()]);
      setInteractionCount((prev) => prev + 1);
    } finally {
      setIsLoading(false);
      setInput("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (onClose) onClose();
      return;
    }
    if (revealNpcIndex !== null && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      skipNpcReveal();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getRelationshipColor = (relationship) => {
    const colors = {
      stranger: "#6b7280",
      acquaintance: "#3b82f6",
      friend: "#10b981",
      confidant: "#8b5cf6",
      mentor_student: "#f59e0b",
    };
    return colors[relationship] || colors.stranger;
  };

  const getRelationshipIcon = (relationship) => {
    const icons = {
      stranger: "👋",
      acquaintance: "🤝",
      friend: "😊",
      confidant: "💫",
      mentor_student: "📚",
    };
    return icons[relationship] || icons.stranger;
  };

  const npcTypeLabel =
    typeof npc.type === "string"
      ? npc.type.replace(/_/g, " ")
      : "character";

  const getPersonalityTraits = () => {
    if (!npc.personality?.traits) return [];

    return Object.entries(npc.personality.traits)
      .filter(([trait, value]) => value > 70)
      .map(([trait, value]) => ({ trait, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  };

  const npcLineVisible = (message, index) => {
    if (message.type !== "npc") return message.text;
    if (revealNpcIndex !== null && index === revealNpcIndex) {
      return message.text.slice(0, revealNpcLen);
    }
    return message.text;
  };

  const inputLocked =
    isLoading || (!embedded && revealNpcIndex !== null);

  return (
    <div
      className={
        embedded
          ? "npc-interaction-docked"
          : "npc-interaction-overlay"
      }
    >
      {embedded && (
        <button
          type="button"
          className="npc-interaction-close-floating"
          onClick={onClose}
          aria-label="Close conversation"
        >
          ×
        </button>
      )}
      <div
        className={
          embedded
            ? "npc-interaction-container npc-interaction-container--embedded"
            : "npc-interaction-container"
        }
      >
        {!embedded && (
          <div className="npc-header">
            <div className="npc-info">
              <h2>{npc.name}</h2>
              <div className="npc-meta">
                <span className="npc-type">{npcTypeLabel}</span>
                {(npc.area || context.area) && (
                  <span className="npc-location">
                    {npc.area || context.area}
                  </span>
                )}
              </div>
            </div>

            <div className="relationship-status">
              <div
                className="relationship-badge"
                style={{ backgroundColor: getRelationshipColor(relationship) }}
              >
                <span className="relationship-icon">
                  {getRelationshipIcon(relationship)}
                </span>
                <span className="relationship-text">
                  {relationship.charAt(0).toUpperCase() +
                    relationship.slice(1).replace("_", " ")}
                </span>
              </div>
              <div className="interaction-count">
                Chats: {interactionCount}
              </div>
            </div>

            <button
              type="button"
              className="close-button"
              onClick={onClose}
              aria-label="Close conversation"
            >
              ×
            </button>
          </div>
        )}

        {!embedded && getPersonalityTraits().length > 0 && (
          <div className="personality-display">
            <h4>Prominent traits</h4>
            <div className="traits-list">
              {getPersonalityTraits().map(({ trait, value }) => (
                <div key={trait} className="trait-item">
                  <span className="trait-name">
                    {trait.charAt(0).toUpperCase() + trait.slice(1)}
                  </span>
                  <div className="trait-bar">
                    <div
                      className="trait-fill"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="trait-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentQuest && (
          <div
            className={`current-quest${embedded ? " current-quest--compact" : ""}`}
          >
            {!embedded && <h4>Available quest</h4>}
            <div className="quest-info">
              <h5>{currentQuest.title}</h5>
              {!embedded && <p>{currentQuest.description}</p>}
              {currentQuest.stages && currentQuest.stages.length > 0 && (
                <div className="quest-progress">
                  {!embedded ? <strong>Next: </strong> : null}
                  {currentQuest.stages[0].task}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conversation Area */}
        <div
          className={`conversation-area${revealNpcIndex !== null ? " conversation-area--revealing" : ""}`}
          onClick={() => revealNpcIndex !== null && skipNpcReveal()}
          role="log"
          aria-live={revealNpcIndex !== null ? "off" : "polite"}
          aria-busy={revealNpcIndex !== null}
        >
          {revealNpcIndex !== null && (
            <p className="npc-reveal-hint">
              Space or tap — show all · hold Shift — faster
            </p>
          )}
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              <div className="message-content">
                {(!embedded || message.type === "user") && (
                  <div className="message-author">
                    {message.type === "npc" ? message.author : "You"}
                  </div>
                )}
                <div className="message-text">{npcLineVisible(message, index)}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message npc">
              <div className="message-content">
                {!embedded && (
                  <div className="message-author">{npc.name}</div>
                )}
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={`input-area${embedded ? " input-area--compact" : ""}`}>
          {!embedded && (
            <div className="quick-actions">
              <button
                type="button"
                onClick={() => setInput("Tell me about yourself")}
                disabled={inputLocked}
              >
                About them
              </button>
              <button
                type="button"
                onClick={() => setInput("What wisdom do you have for me?")}
                disabled={inputLocked}
              >
                Wisdom
              </button>
              {currentQuest && (
                <button
                  type="button"
                  onClick={() => setInput("Tell me more about this quest")}
                  disabled={inputLocked}
                >
                  Quest
                </button>
              )}
            </div>
          )}
          {embedded && (
            <div className="quick-actions quick-actions--chips">
              <button
                type="button"
                className="qa-chip qa-chip--close"
                onClick={onClose}
              >
                Done
              </button>
              <button
                type="button"
                className="qa-chip"
                onClick={() => setInput("Tell me about yourself")}
                disabled={inputLocked}
              >
                About
              </button>
              <button
                type="button"
                className="qa-chip"
                onClick={() => setInput("What wisdom do you have for me?")}
                disabled={inputLocked}
              >
                Wisdom
              </button>
              {currentQuest && (
                <button
                  type="button"
                  className="qa-chip"
                  onClick={() => setInput("Tell me more about this quest")}
                  disabled={inputLocked}
                >
                  Quest
                </button>
              )}
            </div>
          )}
          <div className="input-container">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                embedded ? "Your reply…" : `Your reply to ${npc.name}…`
              }
              disabled={inputLocked}
              rows={embedded ? 1 : 2}
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!input.trim() || inputLocked}
              className={`send-button${embedded ? " send-button--compact" : ""}`}
            >
              Reply
            </button>
          </div>
        </div>

        {!embedded && (
          <div className="context-display">
            <div className="context-item">
              {context.area || "Unknown location"}
            </div>
            {context.weather && (
              <div className="context-item">{context.weather}</div>
            )}
            <div className="context-item">
              {new Date().getHours() < 12
                ? "Morning"
                : new Date().getHours() < 18
                  ? "Afternoon"
                  : "Evening"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NPCInteraction;
