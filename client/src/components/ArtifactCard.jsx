import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './shared/Button';
import '../styles/ArtifactCard.css';

const ArtifactCard = ({ artifact, onVote, onComment, onView, onShare, onDelete, onEdit }) => {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!artifact) {
    return null; // Don't render anything if artifact is undefined
  }

  // Check if user has already voted
  const hasVoted = artifact.voters?.includes(user?.id);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
      setComment('');
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

  // Check if current user is the creator of the artifact
  const isCreator = () => {
    if (!user) return false;
    
    // Check different possible creator ID formats
    return (
      (artifact.creator?._id && artifact.creator._id === user.id) || 
      (artifact.creator?.id && artifact.creator.id === user.id) ||
      (artifact.creator === user.id)
    );
  };

  // Render attachment if present
  const renderAttachment = () => {
    if (!artifact.attachment) return null;

    const isImage = artifact.attachmentType === 'image';
    const isAudio = artifact.attachmentType === 'audio';
    const isVideo = artifact.attachmentType === 'video';

    if (isImage) {
      return (
        <img 
          src={artifact.attachment} 
          alt={artifact.attachmentOriginalName || 'Artifact attachment'} 
          className="artifact-attachment-image"
        />
      );
    }

    if (isAudio) {
      return (
        <audio controls className="artifact-attachment-audio">
          <source src={artifact.attachment} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      );
    }

    if (isVideo) {
      return (
        <video controls className="artifact-attachment-video">
          <source src={artifact.attachment} type="video/mp4" />
          Your browser does not support the video element.
        </video>
      );
    }

    // For other types, show a download link
    return (
      <a 
        href={artifact.attachment} 
        download={artifact.attachmentOriginalName}
        className="artifact-attachment-download"
      >
        📎 Download {artifact.attachmentOriginalName || 'attachment'}
      </a>
    );
  };

  return (
    <div className={`artifact-card ${isExpanded ? 'expanded' : ''}`}>
      <div className="artifact-header">
        <h3 onClick={handleView}>{artifact.name}</h3>
        <div className="artifact-meta">
          <span>By {artifact.creator?.username || 'Unknown'}</span>
          <span>{formatDate(artifact.createdAt)}</span>
        </div>
      </div>

      {isExpanded ? (
        <div className="artifact-content">
          <p>{artifact.description}</p>
          {renderAttachment()}
          
          <div className="artifact-actions">
            <Button onClick={handleVote} className={`vote-button ${hasVoted ? 'voted' : ''}`}>
              ⭐ {artifact.votes || 0}
            </Button>
            <Button onClick={() => setShowComments(!showComments)}>
              💬 {artifact.comments?.length || 0}
            </Button>
            <Button onClick={handleShare}>
              🔗 {artifact.shares || 0}
            </Button>
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
                    <div key={comment._id || `comment-${index}`} className="comment-item">
                      <div className="comment-header">
                        <span className="comment-author">{comment.user?.username || 'Unknown'}</span>
                        <span className="comment-date">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="comment-text">{comment.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="no-comments">No comments yet. Be the first to comment!</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="artifact-preview">
          <p className="artifact-preview-description">
            {artifact.description ? artifact.description.substring(0, 100) + '...' : 'No description available'}
          </p>
          <div className="artifact-preview-stats">
            <span>⭐ {artifact.votes || 0}</span>
            <span>💬 {artifact.comments?.length || 0}</span>
            <span>👁️ {artifact.views || 0}</span>
          </div>
          {isCreator() && (
            <div className="artifact-preview-actions">
              <button onClick={handleEdit} className="preview-action-btn edit-btn" title="Edit Artifact">✏️</button>
              <button onClick={handleDelete} className="preview-action-btn delete-btn" title="Delete Artifact">🗑️</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArtifactCard; 