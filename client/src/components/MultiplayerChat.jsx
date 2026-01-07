import React, { useState, useEffect, useRef, useCallback } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { useAuth } from "../context/AuthContext";
import "./MultiplayerChat.css";

const MultiplayerChat = ({
  worldId,
  worldName,
  onPlayerClick,
  className = "",
}) => {
  const { socket, isConnected, sendMessage } = useWebSocket();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [chatType, setChatType] = useState("world"); // 'world', 'private', 'artifact'
  const [selectedUser, setSelectedUser] = useState(null);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle incoming Socket.io messages
  useEffect(() => {
    if (!socket) return;

    const handleWorldJoined = (data) => {
      if (data.worldId === worldId) {
        setOnlinePlayers(data.players || []);
        setMessages(data.messages || []);
      }
    };

    const handleWorldMessage = (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: data.messageId || Date.now(),
          type: "world",
          senderId: data.senderId,
          senderName: data.senderName,
          senderAvatar: data.senderAvatar,
          senderLevel: data.senderLevel,
          content: data.content,
          timestamp: new Date(data.timestamp),
          isOwn: data.senderId === user?._id,
        },
      ]);
    };

    const handlePlayerJoined = (data) => {
      setOnlinePlayers((prev) => {
        const existing = prev.find((p) => p.userId === data.userId);
        if (!existing) {
          return [
            ...prev,
            {
              userId: data.userId,
              username: data.username,
              avatar: data.avatar,
              position: data.position,
            },
          ];
        }
        return prev;
      });

      // Add system message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "system",
          content: `${data.username} joined the world`,
          timestamp: new Date(),
        },
      ]);
    };

    const handlePlayerLeft = (data) => {
      setOnlinePlayers((prev) => prev.filter((p) => p.userId !== data.userId));

      // Add system message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "system",
          content: `${data.username} left the world`,
          timestamp: new Date(),
        },
      ]);
    };

    const handlePlayersUpdated = (data) => {
      setOnlinePlayers(data.players || []);
    };

    const handleTyping = (data) => {
      if (data.userId !== user?._id) {
        setTypingUsers((prev) => new Set(prev).add(data.username));
        setTimeout(() => {
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.username);
            return newSet;
          });
        }, 3000);
      }
    };

    const handleReaction = (data) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === data.messageId) {
            return {
              ...msg,
              reactions: [
                ...(msg.reactions || []),
                {
                  userId: data.userId,
                  username: data.username,
                  emoji: data.emoji,
                },
              ],
            };
          }
          return msg;
        }),
      );
    };

    // Add Socket.io event listeners
    socket.on("world:joined", handleWorldJoined);
    socket.on("world:message", handleWorldMessage);
    socket.on("world:user-joined", handlePlayerJoined);
    socket.on("world:user-left", handlePlayerLeft);
    socket.on("world:players-updated", handlePlayersUpdated);
    socket.on("user:typing", handleTyping);
    socket.on("world:reaction", handleReaction);

    // Join world when component mounts
    if (isConnected && worldId) {
      sendMessage("world:join", {
        worldId,
        worldName,
        position: { x: 0, y: 0, z: 0 },
      });
    }

    return () => {
      // Clean up event listeners
      socket.off("world:joined", handleWorldJoined);
      socket.off("world:message", handleWorldMessage);
      socket.off("world:user-joined", handlePlayerJoined);
      socket.off("world:user-left", handlePlayerLeft);
      socket.off("world:players-updated", handlePlayersUpdated);
      socket.off("user:typing", handleTyping);
      socket.off("world:reaction", handleReaction);

      // Leave world when component unmounts
      if (isConnected && worldId) {
        sendMessage("world:leave", { worldId });
      }
    };
  }, [socket, isConnected, worldId, worldName, user?._id, sendMessage]);

  // Handle typing indicator
  const handleInputChange = useCallback(
    (e) => {
      setInputMessage(e.target.value);

      // Send typing indicator
      if (isConnected && worldId) {
        sendMessage("user:typing", {
          userId: selectedUser?.userId,
          isTyping: true,
        });

        // Clear typing indicator after delay
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          sendMessage("user:typing", {
            userId: selectedUser?.userId,
            isTyping: false,
          });
        }, 1000);
      }
    },
    [isConnected, worldId, selectedUser, sendMessage],
  );

  // Handle message submission
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      if (!inputMessage.trim() || !isConnected) return;

      const messageData = {
        worldId,
        content: inputMessage.trim(),
      };

      sendMessage("world:message", messageData);
      setInputMessage("");

      // Clear typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendMessage("user:typing", {
        userId: selectedUser?.userId,
        isTyping: false,
      });
    },
    [inputMessage, isConnected, worldId, selectedUser, sendMessage],
  );

  // Handle emoji selection
  const handleEmojiClick = useCallback((emoji) => {
    setInputMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  }, []);

  // Handle message reaction
  const handleMessageReaction = useCallback(
    (messageId, emoji) => {
      if (isConnected && worldId) {
        sendMessage("world:react", {
          messageId,
          emoji,
          worldId,
        });
      }
    },
    [isConnected, worldId, sendMessage],
  );

  // Handle player click
  const handlePlayerClick = useCallback(
    (player) => {
      if (onPlayerClick) {
        onPlayerClick(player);
      }
    },
    [onPlayerClick],
  );

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const emojis = ["😊", "👍", "❤️", "🎉", "🔥", "💯", "👏", "🤔", "😅", "😎"];

  if (isMinimized) {
    return (
      <div className={`multiplayer-chat minimized ${className}`}>
        <button className="chat-toggle" onClick={() => setIsMinimized(false)}>
          💬 {worldName} ({onlinePlayers.length})
          {!isConnected && (
            <span className="connection-status disconnected">●</span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`multiplayer-chat ${className} ${!isConnected ? "disconnected" : ""}`}
    >
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-title">
          <span className="world-name">{worldName}</span>
          <span className="player-count">({onlinePlayers.length} online)</span>
          <span
            className={`connection-status ${isConnected ? "connected" : "disconnected"}`}
            aria-label={`Connection status: ${isConnected ? "Connected" : "Disconnected"}`}
            role="status"
          >
            {isConnected ? "●" : "●"}
          </span>
        </div>
        <div className="chat-controls">
          <button
            className="minimize-button"
            onClick={() => setIsMinimized(true)}
            aria-label="Minimize chat"
            title="Minimize chat"
          >
            −
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        className="chat-messages"
        ref={messagesEndRef}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.type} ${message.isOwn ? "own" : ""}`}
            role="article"
            aria-label={`${message.senderName || "System"}: ${message.content}`}
          >
            {message.type === "world" && (
              <div className="message-header">
                <img
                  src={message.senderAvatar || "/default-avatar.png"}
                  alt={`${message.senderName}'s avatar`}
                  className="sender-avatar"
                />
                <span className="sender-name">{message.senderName}</span>
                <span className="sender-level">Lv.{message.senderLevel}</span>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            )}
            <div className="message-content">{message.content}</div>
            {message.reactions && message.reactions.length > 0 && (
              <div className="message-reactions">
                {message.reactions.map((reaction, index) => (
                  <span
                    key={index}
                    className="reaction"
                    aria-label={`${reaction.username} reacted with ${reaction.emoji}`}
                  >
                    {reaction.emoji}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {typingUsers.size > 0 && (
          <div className="typing-indicator" role="status" aria-live="polite">
            {Array.from(typingUsers).join(", ")}{" "}
            {Array.from(typingUsers).length === 1 ? "is" : "are"} typing...
          </div>
        )}
      </div>

      {/* Online Players */}
      <div className="online-players">
        <h3>Online Players ({onlinePlayers.length})</h3>
        <div
          className="players-list"
          role="list"
          aria-label="Online players list"
        >
          {onlinePlayers.map((player) => (
            <div
              key={player.userId}
              className="player-item"
              role="listitem"
              aria-label={`${player.username} is online`}
            >
              <img
                src={player.avatar || "/default-avatar.png"}
                alt={`${player.username}'s avatar`}
                className="player-avatar"
              />
              <span className="player-name">{player.username}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        <form onSubmit={handleSubmit} className="message-form">
          <div className="input-group">
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="message-input"
              aria-label="Type your message"
              aria-describedby="message-help"
              maxLength={1000}
              disabled={!isConnected}
            />
            <button
              type="submit"
              className="send-button"
              disabled={!inputMessage.trim() || !isConnected}
              aria-label="Send message"
            >
              Send
            </button>
          </div>
          <div id="message-help" className="message-help">
            Press Enter to send, Shift+Enter for new line
          </div>
        </form>

        {/* Quick Reactions */}
        <div className="quick-reactions">
          <span className="reactions-label">Quick reactions:</span>
          {["👍", "❤️", "😂", "😮", "😢", "😡"].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleQuickReaction(emoji)}
              className="quick-reaction-button"
              aria-label={`React with ${emoji}`}
              disabled={!isConnected}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MultiplayerChat;
