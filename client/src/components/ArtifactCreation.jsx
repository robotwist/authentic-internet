import React, { useState } from "react";
import PropTypes from "prop-types";
import { createArtifact } from "../api/api";
import { 
  getRandomQuote, 
  getRandomShakespeareQuote, 
  getQuoteForArtifact, 
  getZenQuote,
  getTodayQuote
} from "../api/externalApis";
import "./ArtifactCreation.css";

const ArtifactCreation = ({ position, onClose, refreshArtifacts }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    messageText: "",
    content: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Validate token/auth
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please log in and try again.");
      }

      // Validate form data
      if (!formData.name.trim()) {
        throw new Error("Name is required");
      }
      if (!formData.description.trim()) {
        throw new Error("Description is required");
      }

      // Always set content to description if empty to meet server requirements
      const updatedFormData = {
        ...formData,
        content: formData.content || formData.description, // Ensure content is filled
        location: {
          x: parseFloat(position.x) || 0,
          y: parseFloat(position.y) || 0
        },
        exp: 10,
        visible: true,
        status: "dropped",
        type: "artifact",
        area: "Overworld" // Default area
      };

      console.log("Submitting artifact data:", updatedFormData);
      const response = await createArtifact(updatedFormData);
      console.log("Artifact created:", response);
      
      setSuccess("Artifact created successfully!");
      
      // Refresh artifacts to update the game world
      if (typeof refreshArtifacts === 'function') {
        try {
          await refreshArtifacts();
        } catch (refreshError) {
          console.error("Error refreshing artifacts:", refreshError);
          // Don't fail the entire operation if just the refresh fails
        }
      }
      
      // Close form after a short delay to allow user to see success message
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err) {
      console.error("Error creating artifact:", err);
      setError(err.message || "Failed to create artifact. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get a random quote for the artifact content
  const generateRandomQuote = async (source = 'general') => {
    setIsLoadingQuote(true);
    setError("");
    
    try {
      let quoteData;
      
      switch(source) {
        case 'shakespeare':
          quoteData = await getRandomShakespeareQuote();
          break;
        case 'zen':
          quoteData = await getZenQuote();
          break;
        case 'today':
          quoteData = await getTodayQuote();
          break;
        case 'themed':
          // Use the artifact name or description as a theme
          const theme = formData.name || "wisdom";
          quoteData = await getQuoteForArtifact(theme);
          break;
        default:
          // General random quote
          quoteData = await getRandomQuote();
          break;
      }
      
      // Update the content field with the quote
      setFormData(prev => ({
        ...prev,
        content: `"${quoteData.text}" - ${quoteData.source}`
      }));
      
    } catch (err) {
      setError("Failed to generate quote. Try again or enter content manually.");
      console.error("Error generating quote:", err);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  return (
    <div className="artifact-creation-overlay">
      <div className="artifact-creation-form">
        <h2>Create New Artifact</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              maxLength={50}
              required
              placeholder="Enter artifact name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              maxLength={200}
              required
              placeholder="Describe your artifact"
            />
          </div>
          <div className="form-group">
            <label htmlFor="content">Content:</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              maxLength={500}
              placeholder="Enter detailed content (will use description if left empty)"
            />
            <div className="quote-buttons">
              <button 
                type="button" 
                onClick={() => generateRandomQuote()}
                disabled={isLoadingQuote}
                className="quote-btn"
              >
                {isLoadingQuote ? "Loading..." : "Random Quote"}
              </button>
              <button 
                type="button" 
                onClick={() => generateRandomQuote('shakespeare')}
                disabled={isLoadingQuote}
                className="quote-btn"
              >
                {isLoadingQuote ? "Loading..." : "Shakespeare"}
              </button>
              <button 
                type="button" 
                onClick={() => generateRandomQuote('zen')}
                disabled={isLoadingQuote}
                className="quote-btn"
              >
                {isLoadingQuote ? "Loading..." : "Zen Quote"}
              </button>
              <button 
                type="button" 
                onClick={() => generateRandomQuote('today')}
                disabled={isLoadingQuote}
                className="quote-btn"
              >
                {isLoadingQuote ? "Loading..." : "Today's Quote"}
              </button>
              <button 
                type="button" 
                onClick={() => generateRandomQuote('themed')}
                disabled={isLoadingQuote || !formData.name}
                className="quote-btn"
                title={!formData.name ? "Enter a name first for a themed quote" : ""}
              >
                {isLoadingQuote ? "Loading..." : "Themed Quote"}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="messageText">Message (optional):</label>
            <textarea
              id="messageText"
              name="messageText"
              value={formData.messageText}
              onChange={handleChange}
              maxLength={500}
            />
          </div>
          <div className="form-actions">
            <button 
              type="submit" 
              disabled={isSubmitting || !formData.name || !formData.description}
            >
              {isSubmitting ? "Creating..." : "Create Artifact"}
            </button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

ArtifactCreation.propTypes = {
  position: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  refreshArtifacts: PropTypes.func.isRequired
};

export default ArtifactCreation;
