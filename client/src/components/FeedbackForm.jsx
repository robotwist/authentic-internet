import React, { useState } from 'react';
import './FeedbackForm.css';
import { useAuth } from '../context/AuthContext'; // Import Auth context to get user info if logged in

// Updated for automatic deployment testing - Added GitHub repository secrets
const FeedbackForm = ({ onClose }) => {
  const { user } = useAuth(); // Get current authenticated user if available
  const [feedback, setFeedback] = useState({
    gameplay: '',
    bugs: '',
    visual: '',
    performance: '',
    suggestions: '',
    email: '',
    name: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExportInstructions, setShowExportInstructions] = useState(false);
  const [serverSubmitSuccess, setServerSubmitSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFeedback(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get session and device information
      const deviceInfo = {
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        mapLocation: window.gameState?.currentMapIndex !== undefined 
          ? `Map: ${window.gameState.currentMapIndex}`
          : 'Unknown',
        gameVersion: process.env.VITE_APP_VERSION || '1.0'
      };

      // Combine user feedback with device info
      const feedbackData = {
        ...feedback,
        deviceInfo
      };

      // If user is authenticated, add their name and email
      if (user) {
        if (!feedbackData.name) feedbackData.name = user.username;
        if (!feedbackData.email) feedbackData.email = user.email;
      }

      // Save to localStorage as backup
      const existingFeedback = JSON.parse(localStorage.getItem('gameFeedback') || '[]');
      localStorage.setItem('gameFeedback', JSON.stringify([...existingFeedback, feedbackData]));

      // Submit to server API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include auth token if user is logged in
          ...(localStorage.getItem('authToken') && {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          })
        },
        body: JSON.stringify(feedbackData)
      });

      if (response.ok) {
        console.log("📝 Feedback submitted to server successfully");
        setServerSubmitSuccess(true);
      } else {
        console.warn("Server submission failed, but feedback saved locally");
        // Don't show error to user since we saved locally
      }
      
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      // Still mark as submitted if saved to localStorage
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportFeedback = () => {
    try {
      const feedbackData = localStorage.getItem('gameFeedback') || '[]';
      const blob = new Blob([feedbackData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'game-feedback.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowExportInstructions(true);
    } catch (error) {
      console.error("Error exporting feedback:", error);
      alert("There was an error exporting feedback data.");
    }
  };

  const handleCopyFeedbackToClipboard = () => {
    try {
      const feedbackData = localStorage.getItem('gameFeedback') || '[]';
      navigator.clipboard.writeText(feedbackData).then(() => {
        alert("Feedback copied to clipboard! You can now paste it into an email or document.");
      });
    } catch (error) {
      console.error("Error copying feedback:", error);
      alert("There was an error copying the feedback to clipboard.");
    }
  };

  if (submitted) {
    return (
      <div className="feedback-form-container">
        <div className="feedback-form">
          <h2>Thank You!</h2>
          <p>Your feedback has been saved successfully.</p>
          <p>To share your feedback with the developer:</p>
          
          <div className="export-options">
            <button onClick={handleExportFeedback} className="primary-button">
              Download Feedback File
            </button>
            <button onClick={handleCopyFeedbackToClipboard} className="secondary-button">
              Copy to Clipboard
            </button>
          </div>
          
          {showExportInstructions && (
            <div className="export-instructions">
              <h3>What's Next?</h3>
              <p>Please send the downloaded JSON file to the developer:</p>
              <ol>
                <li>Create a new email</li>
                <li>Attach the game-feedback.json file</li>
                <li>Send it to the developer directly or through whatever communication channel you use</li>
              </ol>
            </div>
          )}
          
          <div className="button-container">
            <button onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-form-container">
      <div className="feedback-form">
        <div className="form-header">
          <h2>Game Feedback</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Your Name (Optional):</label>
            <input
              type="text"
              id="name"
              name="name"
              value={feedback.name}
              onChange={handleChange}
              placeholder="Enter your name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Your Email (Optional):</label>
            <input
              type="email"
              id="email"
              name="email"
              value={feedback.email}
              onChange={handleChange}
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="gameplay">Gameplay Experience:</label>
            <textarea
              id="gameplay"
              name="gameplay"
              value={feedback.gameplay}
              onChange={handleChange}
              placeholder="How was your overall gameplay experience? Was it fun? Challenging?"
              rows={3}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="bugs">Bugs or Issues:</label>
            <textarea
              id="bugs"
              name="bugs"
              value={feedback.bugs}
              onChange={handleChange}
              placeholder="Did you encounter any bugs or issues? Please describe them in detail (what happened, where, and how to reproduce)."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="visual">Visual and Audio:</label>
            <textarea
              id="visual"
              name="visual"
              value={feedback.visual}
              onChange={handleChange}
              placeholder="How were the visuals and sound effects? Any suggestions for improvement?"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="performance">Performance:</label>
            <textarea
              id="performance"
              name="performance"
              value={feedback.performance}
              onChange={handleChange}
              placeholder="How was the game performance? Any lag or loading issues?"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="suggestions">Suggestions:</label>
            <textarea
              id="suggestions"
              name="suggestions"
              value={feedback.suggestions}
              onChange={handleChange}
              placeholder="Any suggestions or ideas for improving the game?"
              rows={3}
            />
          </div>

          <div className="button-container">
            <button 
              type="submit" 
              disabled={isSubmitting || !feedback.gameplay}
              className={isSubmitting ? 'loading' : ''}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
            <button 
              type="button" 
              onClick={handleExportFeedback}
              className="secondary-button"
            >
              Export All Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm; 