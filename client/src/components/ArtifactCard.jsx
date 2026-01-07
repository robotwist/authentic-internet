import React, { useState } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../context/AuthContext";
import Button from "./shared/Button";
import "../styles/ArtifactCard.css";

const ArtifactCard = ({
  artifact,
  onVote,
  onComment,
  onView,
  onShare,
  onDelete,
  onEdit,
}) => {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!artifact) {
    return null; // Don't render anything if artifact is undefined
  }

  // Check if user has already voted
  const hasVoted = artifact.voters?.includes(user?.id);

  // Check if current user is the creator of the artifact
  const isCreator = () => {
    return (
      user &&
      (artifact.createdBy === user.id ||
        artifact.creator?.id === user.id ||
        artifact.creator === user.id)
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get artifact type display name
  const getTypeDisplay = (type) => {
    const typeMap = {
      artifact: "General Artifact",
      WEAPON: "Weapon",
      SCROLL: "Scroll/Text",
      ART: "Visual Art",
      MUSIC: "Music/Audio",
      GAME: "Game",
      PUZZLE: "Puzzle",
      STORY: "Story",
      TOOL: "Tool",
      TREASURE: "Treasure",
      PORTAL: "Portal",
      NPC: "NPC",
      ENVIRONMENT: "Environment",
    };
    return typeMap[type] || type;
  };

  // Handle vote
  const handleVote = () => {
    if (onVote) {
      onVote(artifact._id);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (comment.trim() && onComment) {
      onComment(artifact._id, comment);
      setComment("");
    }
  };

  // Handle view tracking
  const handleView = () => {
    if (!isExpanded && onView) {
      onView(artifact._id);
    }
    setIsExpanded(!isExpanded);
  };

  // Handle share
  const handleShare = () => {
    if (onShare) {
      onShare(artifact._id);
    }
  };

  // Handle delete with confirmation
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${artifact.name}"?`)) {
      if (onDelete) {
        onDelete(artifact._id);
      }
    }
  };

  // Handle edit
  const handleEdit = () => {
    if (onEdit) {
      onEdit(artifact);
    }
  };

  // Render attachment/media
  const renderAttachment = () => {
    // Check for media array first (unified model)
    if (artifact.media && artifact.media.length > 0) {
      const imageMedia = artifact.media.find((url) =>
        url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i),
      );
      if (imageMedia) {
        return (
          <div className="artifact-media">
            <img
              src={imageMedia}
              alt={artifact.name}
              className="artifact-image"
            />
          </div>
        );
      }
    }

    // Check for legacy attachment field
    if (artifact.attachment) {
      if (artifact.attachment.startsWith("data:image")) {
        return (
          <div className="artifact-media">
            <img
              src={artifact.attachment}
              alt={artifact.name}
              className="artifact-image"
            />
          </div>
        );
      } else {
        return (
          <div className="artifact-attachment">
            <span className="attachment-icon">📎</span>
            <span className="attachment-name">{artifact.attachment}</span>
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className={`artifact-card ${isExpanded ? "expanded" : ""}`}>
      <div className="artifact-header">
        <h3 onClick={handleView}>{artifact.name}</h3>
        <div className="artifact-meta">
          <span className="artifact-type">{getTypeDisplay(artifact.type)}</span>
          <span>
            By {artifact.creator?.username || artifact.createdBy || "Unknown"}
          </span>
          <span>{formatDate(artifact.createdAt)}</span>
        </div>
      </div>

      {isExpanded ? (
        <div className="artifact-content">
          <p className="artifact-description">{artifact.description}</p>

          {/* Display experience reward */}
          {artifact.exp > 0 && (
            <div className="artifact-exp">
              <span className="exp-label">Reward:</span>
              <span className="exp-value">+{artifact.exp} XP</span>
            </div>
          )}

          {/* Display tags */}
          {artifact.tags && artifact.tags.length > 0 && (
            <div className="artifact-tags">
              {artifact.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Display rating */}
          {artifact.rating > 0 && (
            <div className="artifact-rating">
              <span className="rating-label">Rating:</span>
              <span className="rating-value">
                {artifact.rating.toFixed(1)} ⭐
              </span>
            </div>
          )}

          {renderAttachment()}

          <div className="artifact-actions">
            <Button
              onClick={handleVote}
              className={`vote-button ${hasVoted ? "voted" : ""}`}
            >
              ⭐ {artifact.votes || 0}
            </Button>
            <Button onClick={() => setShowComments(!showComments)}>
              💬 {artifact.comments?.length || 0}
            </Button>
            <Button onClick={handleShare}>🔗 {artifact.shares || 0}</Button>
            {isCreator() && (
              <>
                <Button onClick={handleEdit} className="edit-button">
                  ✏️ Edit
                </Button>
                <Button onClick={handleDelete} className="delete-button">
                  🗑️ Delete
                </Button>
              </>
            )}
          </div>

          {showComments && (
            <div className="comments-section">
              <form onSubmit={handleCommentSubmit} className="comment-form">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  required
                />
                <Button type="submit">Post</Button>
              </form>

              <div className="comments-list">
                {artifact.comments && artifact.comments.length > 0 ? (
                  artifact.comments.map((comment, index) => (
                    <div
                      key={comment._id || `comment-${index}`}
                      className="comment-item"
                    >
                      <div className="comment-header">
                        <span className="comment-author">
                          {comment.user?.username || "Unknown"}
                        </span>
                        <span className="comment-date">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="comment-text">{comment.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="no-comments">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="artifact-preview">
          <p className="artifact-preview-description">
            {artifact.description
              ? artifact.description.substring(0, 100) + "..."
              : "No description available"}
          </p>
          <div className="artifact-preview-stats">
            <span>⭐ {artifact.votes || 0}</span>
            <span>💬 {artifact.comments?.length || 0}</span>
            <span>👁️ {artifact.views || 0}</span>
          </div>
          {isCreator() && (
            <div className="artifact-preview-actions">
              <button
                onClick={handleEdit}
                className="preview-action-btn edit-btn"
                title="Edit Artifact"
              >
                ✏️
              </button>
              <button
                onClick={handleDelete}
                className="preview-action-btn delete-btn"
                title="Delete Artifact"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Add PropTypes at the bottom of the file
ArtifactCard.propTypes = {
  artifact: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    creator: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        _id: PropTypes.string,
        id: PropTypes.string,
        username: PropTypes.string,
      }),
    ]),
    createdAt: PropTypes.string.isRequired,
    votes: PropTypes.number,
    views: PropTypes.number,
    shares: PropTypes.number,
    voters: PropTypes.arrayOf(PropTypes.string),
    comments: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string,
        text: PropTypes.string.isRequired,
        user: PropTypes.shape({
          username: PropTypes.string,
        }),
        createdAt: PropTypes.string,
      }),
    ),
    attachment: PropTypes.string,
    attachmentType: PropTypes.string,
    attachmentOriginalName: PropTypes.string,
  }).isRequired,
  onVote: PropTypes.func,
  onComment: PropTypes.func,
  onView: PropTypes.func,
  onShare: PropTypes.func,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
};

export default ArtifactCard;
