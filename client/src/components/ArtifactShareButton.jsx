import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './ArtifactShareButton.css';

const ArtifactShareButton = ({ artifact, onShare, onUnshare }) => {
  const { user } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [showMarketplaceForm, setShowMarketplaceForm] = useState(false);
  const [marketplaceData, setMarketplaceData] = useState({
    price: 0,
    category: 'new',
    tags: [],
    description: ''
  });

  const handleShare = async () => {
    if (!artifact || !user) return;
    
    setIsSharing(true);
    try {
      const response = await fetch(`/api/artifacts/${artifact._id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (onShare) onShare(result);
        setShowMarketplaceForm(true);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to share artifact');
      }
    } catch (error) {
      console.error('Error sharing artifact:', error);
      alert('Failed to share artifact');
    } finally {
      setIsSharing(false);
    }
  };

  const handleUnshare = async () => {
    if (!artifact || !user) return;
    
    setIsSharing(true);
    try {
      const response = await fetch(`/api/artifacts/${artifact._id}/unshare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (onUnshare) onUnshare(result);
        setShowMarketplaceForm(false);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to unshare artifact');
      }
    } catch (error) {
      console.error('Error unsharing artifact:', error);
      alert('Failed to unshare artifact');
    } finally {
      setIsSharing(false);
    }
  };

  const handleMarketplaceSubmit = async (e) => {
    e.preventDefault();
    
    if (!artifact || !user) return;
    
    setIsSharing(true);
    try {
      const response = await fetch(`/api/artifacts/${artifact._id}/marketplace`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(marketplaceData)
      });

      if (response.ok) {
        const result = await response.json();
        alert('Artifact listed in marketplace successfully!');
        setShowMarketplaceForm(false);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to list artifact in marketplace');
      }
    } catch (error) {
      console.error('Error listing artifact in marketplace:', error);
      alert('Failed to list artifact in marketplace');
    } finally {
      setIsSharing(false);
    }
  };

  const handleTagChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setMarketplaceData(prev => ({ ...prev, tags }));
  };

  if (!artifact || artifact.creator !== user?._id) {
    return null; // Only show for artifact creator
  }

  return (
    <div className="artifact-share-button">
      {!artifact.isShared ? (
        <button 
          className="share-button"
          onClick={handleShare}
          disabled={isSharing}
        >
          {isSharing ? 'Sharing...' : 'Share Artifact'}
        </button>
      ) : (
        <div className="shared-controls">
          <span className="shared-status">✓ Shared</span>
          <button 
            className="unshare-button"
            onClick={handleUnshare}
            disabled={isSharing}
          >
            {isSharing ? 'Unsharing...' : 'Unshare'}
          </button>
          {!artifact.marketplace?.isListed && (
            <button 
              className="marketplace-button"
              onClick={() => setShowMarketplaceForm(true)}
            >
              List in Marketplace
            </button>
          )}
        </div>
      )}

      {showMarketplaceForm && (
        <div className="marketplace-form-overlay">
          <div className="marketplace-form">
            <h3>List in Marketplace</h3>
            <form onSubmit={handleMarketplaceSubmit}>
              <div className="form-group">
                <label>Price (virtual currency):</label>
                <input
                  type="number"
                  min="0"
                  value={marketplaceData.price}
                  onChange={(e) => setMarketplaceData(prev => ({ 
                    ...prev, 
                    price: parseInt(e.target.value) || 0 
                  }))}
                />
              </div>
              
              <div className="form-group">
                <label>Category:</label>
                <select
                  value={marketplaceData.category}
                  onChange={(e) => setMarketplaceData(prev => ({ 
                    ...prev, 
                    category: e.target.value 
                  }))}
                >
                  <option value="new">New</option>
                  <option value="featured">Featured</option>
                  <option value="trending">Trending</option>
                  <option value="popular">Popular</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Tags (comma-separated):</label>
                <input
                  type="text"
                  value={marketplaceData.tags.join(', ')}
                  onChange={handleTagChange}
                  placeholder="puzzle, adventure, story"
                />
              </div>
              
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={marketplaceData.description}
                  onChange={(e) => setMarketplaceData(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
                  placeholder="Describe your artifact..."
                  maxLength="500"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={isSharing}
                >
                  {isSharing ? 'Listing...' : 'List in Marketplace'}
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowMarketplaceForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtifactShareButton;
