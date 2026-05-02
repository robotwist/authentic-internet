import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import "./NPCInteraction.css";

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

  useEffect(() => {
    // Initialize conversation with contextual greeting
    initializeConversation();
  }, [npc]);

  const initializeConversation = async () => {
    // Use fallback dialogue if no API endpoint or _id
    if (!npc._id || !npc._id.trim()) {
      console.log("Using fallback dialogue for NPC:", npc.name);
      setMessages([
        {
          type: "npc",
          text: npc.dialogue?.[0] || "Hello there, traveler!",
          author: npc.name,
          timestamp: new Date(),
        },
      ]);
      return;
    }

    try {
      const response = await fetch(`/api/npcs/${npc._id}/interact`, {
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
      console.log("Using fallback dialogue due to API error:", error.message);
      setMessages([
        {
          type: "npc",
          text: npc.dialogue?.[0] || "Hello there, traveler!",
          author: npc.name,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      type: "user",
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // If no API endpoint, use fallback dialogue rotation
    if (!npc._id || !npc._id.trim()) {
      console.log("Using fallback dialogue for NPC response");
      setTimeout(() => {
        // Pick a random dialogue line or cycle through them
        const dialogueIndex =
          messages.filter((m) => m.type === "npc").length %
          (npc.dialogue?.length || 1);
        const npcResponse = {
          type: "npc",
          text:
            npc.dialogue?.[dialogueIndex] ||
            "Thank you for sharing that with me.",
          author: npc.name,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, npcResponse]);
        setIsLoading(false);
        setInput("");
        setInteractionCount((prev) => prev + 1);
      }, 500); // Simulate thinking delay
      return;
    }

    try {
      const response = await fetch(`/api/npcs/${npc._id}/interact`, {
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
      // Pick a random dialogue line
      const dialogueIndex =
        messages.filter((m) => m.type === "npc").length %
        (npc.dialogue?.length || 1);
      setMessages((prev) => [
        ...prev,
        {
          type: "npc",
          text:
            npc.dialogue?.[dialogueIndex] ||
            "Thank you for sharing that with me.",
          author: npc.name,
          timestamp: new Date(),
        },
      ]);
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

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={
        embedded
          ? "npc-interaction-docked"
          : "npc-interaction-overlay"
      }
    >
      <div
        className={
          embedded
            ? "npc-interaction-container npc-interaction-container--embedded"
            : "npc-interaction-container"
        }
      >
        {/* Header */}
        <div className={`npc-header${embedded ? " npc-header--compact" : ""}`}>
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

          {!embedded && (
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
          )}

          <button
            type="button"
            className={`close-button${embedded ? " close-button--ghost" : ""}`}
            onClick={onClose}
            aria-label="Close conversation"
          >
            {embedded ? "Close" : "×"}
          </button>
        </div>

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
        <div className="conversation-area">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              <div className="message-content">
                <div className="message-author">
                  {message.type === "npc" ? message.author : "You"}
                </div>
                <div className="message-text">{message.text}</div>
                {!embedded && (
                  <div className="message-timestamp">
                    {formatTimestamp(message.timestamp)}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message npc">
              <div className="message-content">
                <div className="message-author">{npc.name}</div>
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
                disabled={isLoading}
              >
                About them
              </button>
              <button
                type="button"
                onClick={() => setInput("What wisdom do you have for me?")}
                disabled={isLoading}
              >
                Wisdom
              </button>
              {currentQuest && (
                <button
                  type="button"
                  onClick={() => setInput("Tell me more about this quest")}
                  disabled={isLoading}
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
                className="qa-chip"
                onClick={() => setInput("Tell me about yourself")}
                disabled={isLoading}
              >
                About
              </button>
              <button
                type="button"
                className="qa-chip"
                onClick={() => setInput("What wisdom do you have for me?")}
                disabled={isLoading}
              >
                Wisdom
              </button>
              {currentQuest && (
                <button
                  type="button"
                  className="qa-chip"
                  onClick={() => setInput("Tell me more about this quest")}
                  disabled={isLoading}
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
                embedded ? `Message ${npc.name.split(" ")[0] || "them"}…`
                  : `Say something to ${npc.name}…`
              }
              disabled={isLoading}
              rows={embedded ? 1 : 2}
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className={`send-button${embedded ? " send-button--compact" : ""}`}
            >
              Send
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
