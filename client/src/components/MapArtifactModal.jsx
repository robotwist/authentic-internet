import React, { useState, useEffect } from 'react';
import './MapArtifactModal.css';

/**
 * Modal component for displaying detailed information about artifacts found on the map.
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Object} props.artifact - The artifact data to display
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {Function} props.onCollect - Function to call when the artifact is collected
 * @param {boolean} props.isCollectible - Whether the artifact can be collected
 */
const MapArtifactModal = ({ 
  visible = false, 
  artifact = {}, 
  onClose,
  onCollect,
  isCollectible = true
}) => {
  const [animation, setAnimation] = useState('');
  
  useEffect(() => {
    // Apply entrance animation when becoming visible
    if (visible) {
      setAnimation('modal-enter');
    }
  }, [visible]);
  
  // Handle closing the modal with exit animation
  const handleClose = () => {
    setAnimation('modal-exit');
    
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Match this with the CSS animation duration
  };
  
  // Handle collecting the artifact
  const handleCollect = () => {
    if (onCollect && artifact) {
      onCollect(artifact);
      handleClose();
    }
  };
  
  // Don't render anything if not visible
  if (!visible) return null;
  
  return (
    <div className={`map-artifact-modal-backdrop ${animation}`} onClick={handleClose}>
      <div className="map-artifact-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={handleClose}>×</button>
        
        <div className="artifact-header">
          <h2 className="artifact-title">{artifact.name || 'Unknown Artifact'}</h2>
          {artifact.type && <div className="artifact-type">{artifact.type}</div>}
        </div>
        
        <div className="artifact-content">
          {artifact.image && (
            <div className="artifact-image-container">
              <img 
                src={artifact.image} 
                alt={artifact.name} 
                className="artifact-image"
              />
            </div>
          )}
          
          <div className="artifact-details">
            <p className="artifact-description">{artifact.description || 'A mysterious artifact'}</p>
            
            {artifact.content && (
              <div className="artifact-content-text">
                <h4>Content:</h4>
                <p>{artifact.content}</p>
              </div>
            )}
            
            {artifact.properties && Object.keys(artifact.properties).length > 0 && (
              <div className="artifact-properties">
                <h4>Properties:</h4>
                <ul>
                  {Object.entries(artifact.properties).map(([key, value]) => (
                    <li key={key}>
                      <span className="property-name">{key}:</span> 
                      <span className="property-value">{value.toString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {artifact.exp > 0 && (
              <div className="artifact-experience">
                <span className="exp-label">Experience:</span> 
                <span className="exp-value">+{artifact.exp} XP</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="artifact-actions">
          {isCollectible && (
            <button 
              className="collect-button" 
              onClick={handleCollect}
            >
              Collect Artifact
            </button>
          )}
          <button 
            className="close-button" 
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapArtifactModal; 