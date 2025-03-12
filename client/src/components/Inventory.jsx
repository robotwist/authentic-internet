import React, { useState } from "react";
import "./Inventory.css";

const fictionalUsers = [
  { id: 1, name: "Socrates" },
  { id: 2, name: "Plato" },
  { id: 3, name: "Aristotle" },
  { id: 4, name: "Ernest" },
  { id: 5, name: "Spicoli" },
];

const Inventory = ({ artifacts, onClose, onUpdateArtifact, onGainExperience, character }) => {
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(fictionalUsers[0].id);

  const handleUseArtifact = (artifact) => {
    console.log(`You have wielded the hallowed artifact: ${artifact.name}`);
    alert(`Your prowess has increased by implementing the mystical artifact: ${artifact.name}`);
    
    onGainExperience(1);

    const updatedArtifact = {
      ...artifact,
      comment: "Used by a previous adventurer",
      value: artifact.value + 1,
      glow: true,
    };

    onUpdateArtifact(updatedArtifact);
  };

  const handleSendMessage = () => {
    console.log(`Sending message: ${message} to user: ${selectedUser}`);
    alert(`Message sent to user: ${selectedUser}`);
    setMessage("");
  };

  const handleEditMessage = (artifact) => {
    setSelectedArtifact(artifact);
    setMessage(artifact.message || "");
  };

  const handleDeleteMessage = (artifact) => {
    const updatedArtifact = {
      ...artifact,
      message: "",
    };
    onUpdateArtifact(updatedArtifact);
    setMessage("");
    setSelectedArtifact(null);
  };

  const handleSaveMessage = () => {
    const updatedArtifact = {
      ...selectedArtifact,
      message,
    };
    onUpdateArtifact(updatedArtifact);
    setMessage("");
    setSelectedArtifact(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove the stored token
    window.location.reload(); // Refresh page to reflect logout
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "#333",
          padding: "20px",
          borderRadius: "10px",
          width: "90%",
          height: "90%",
          maxWidth: "1200px",
          textAlign: "center",
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.5)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2>🎒 Inventory</h2>
          <button onClick={handleLogout} className="logout-button">Log Out</button>
          <button
            onClick={onClose}
            style={{
              backgroundColor: "#ff4d4d",
              color: "white",
              border: "none",
              padding: "10px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <img
            src={character.avatar}
            alt="Character Avatar"
            style={{
              width: "150px",
              height: "80px",
              borderRadius: "50%",
              marginRight: "10px",
            }}
          />
          <div>
            <h3>{character.name}</h3>
            <p>Level: {character.level}</p>
            <p>Experience: {character.experience}</p>
          </div>
        </div>
        {artifacts.length > 0 ? (
          <ul
            style={{
              listStyleType: "none",
              padding: 0,
              margin: 0,
              flexGrow: 1,
              overflowY: "auto",
            }}
          >
            {artifacts.map((artifact, index) => (
              <li
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#444",
                  padding: "1px",
                  borderRadius: "10px",
                  marginBottom: "10px",
                }}
              >
                <img
                  src={artifact.icon || "/assets/default-artifact.png"}
                  alt={artifact.iconDescription || "Artifact"}
                  style={{
                    width: "50px",
                    height: "50px",
                    marginRight: "10px",
                  }}
                />
                <div>
                  <strong>{artifact.name}</strong> - {artifact.iconDescription}
                </div>
                <div>
                  <button
                    onClick={() => handleUseArtifact(artifact)}
                    style={{
                      backgroundColor: "#4caf50",
                      color: "white",
                      border: "none",
                      padding: "5px",
                      borderRadius: "5px",
                      cursor: "pointer",
                      marginRight: "15px",
                    }}
                  >
                    Use Artifact
                  </button>
                  <button
                    onClick={() => handleEditMessage(artifact)}
                    style={{
                      backgroundColor: "#4caf50",
                      color: "white",
                      border: "none",
                      padding: "5px",
                      borderRadius: "5px",
                      cursor: "pointer",
                      marginRight: "10px",
                    }}
                  >
                    Edit/Read Message
                  </button>
                  <button
                    onClick={() => handleDeleteMessage(artifact)}
                    style={{
                      backgroundColor: "#ff4d4d",
                      color: "white",
                      border: "none",
                      padding: "5px",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Delete Message
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Empty</p>
        )}
        {selectedArtifact && (
          <div
            style={{
              marginTop: "20px",
            }}
          >
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message"
              style={{
                width: "100%",
                height: "100px",
                marginBottom: "10px",
              }}
            />
            <button
              onClick={handleSaveMessage}
              style={{
                marginRight: "10px",
                backgroundColor: "#4caf50",
                color: "white",
                border: "none",
                padding: "10px",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Save Message
            </button>
            <button
              onClick={() => setSelectedArtifact(null)}
              style={{
                backgroundColor: "#ff4d4d",
                color: "white",
                border: "none",
                padding: "10px",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        )}
        <div
          style={{
            marginTop: "20px",
          }}
        >
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message"
            style={{
              width: "100%",
              height: "70px",
              marginBottom: "10px",
            }}
          />
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            style={{
              marginBottom: "10px",
              padding: "10px",
              borderRadius: "5px",
              width: "100%",
            }}
          >
            {fictionalUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleSendMessage}
            style={{
              backgroundColor: "#4caf50",
              color: "white",
              border: "none",
              padding: "10px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
};

export default Inventory;

