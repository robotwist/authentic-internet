import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TILE_SIZE } from './MapConstants';
import './ArtifactDiscovery.css';

const ArtifactDiscovery = ({ 
  artifacts, 
  characterPosition, 
  currentMapName,
  onArtifactFound,
  character
}) => {
  const [nearbyArtifacts, setNearbyArtifacts] = useState([]);
  const [discoveryHints, setDiscoveryHints] = useState([]);
  const [showDiscoveryUI, setShowDiscoveryUI] = useState(false);

  // Memoize the distance calculation function
  const calculateDistance = useCallback((pos1, pos2) => {
    if (!pos1 || !pos2) return Infinity;
    return Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) + 
      Math.pow(pos1.y - pos2.y, 2)
    );
  }, []);

  // Find nearby artifacts and generate hints
  useEffect(() => {
    if (!characterPosition || !artifacts || !Array.isArray(artifacts)) return;

    const playerX = Math.floor(characterPosition.x / TILE_SIZE);
    const playerY = Math.floor(characterPosition.y / TILE_SIZE);
    const discoveryRadius = 3; // Number of tiles to check

    try {
      // Find artifacts within discovery radius
      const nearby = artifacts.filter(artifact => {
        if (!artifact || !artifact.location || artifact.area !== currentMapName) return false;
        
        const distance = calculateDistance(
          { x: playerX, y: playerY },
          { x: artifact.location.x, y: artifact.location.y }
        );
        
        return distance <= discoveryRadius;
      });

      setNearbyArtifacts(nearby);

      // Generate hints for artifacts
      const hints = nearby.map(artifact => {
        const distance = calculateDistance(
          { x: playerX, y: playerY },
          { x: artifact.location.x, y: artifact.location.y }
        );
        
        let hint = '';
        if (distance === 0) {
          hint = 'You are standing on an artifact!';
        } else if (distance === 1) {
          hint = 'An artifact is very close by!';
        } else if (distance === 2) {
          hint = 'You sense an artifact nearby...';
        } else {
          hint = 'There might be something interesting in this area...';
        }

        return {
          artifactId: artifact._id || artifact.id,
          hint,
          distance
        };
      });

      setDiscoveryHints(hints);
      setShowDiscoveryUI(hints.length > 0);
    } catch (error) {
      console.error('Error processing artifacts:', error);
      setShowDiscoveryUI(false);
    }
  }, [characterPosition, artifacts, currentMapName, calculateDistance]);

  // Memoize the artifact finding handler
  const handleArtifactFound = useCallback((artifact) => {
    if (onArtifactFound && artifact) {
      onArtifactFound(artifact);
    }
  }, [onArtifactFound]);

  // Don't render if there's nothing to show
  if (!showDiscoveryUI || !nearbyArtifacts.length) return null;

  return (
    <div className="artifact-discovery">
      <div className="discovery-header">
        <h3>Artifact Discovery</h3>
        <span className="discovery-count">{nearbyArtifacts.length} artifacts nearby</span>
      </div>
      
      <div className="discovery-hints">
        {discoveryHints.map(({ artifactId, hint, distance }) => {
          const artifact = nearbyArtifacts.find(a => a._id === artifactId || a.id === artifactId);
          if (!artifact) return null;

          return (
            <div 
              key={artifactId} 
              className={`discovery-hint ${distance === 0 ? 'found' : ''}`}
            >
              <div className="hint-content">
                <p>{hint}</p>
                {distance === 0 && (
                  <button 
                    className="interact-button"
                    onClick={() => handleArtifactFound(artifact)}
                  >
                    Interact
                  </button>
                )}
              </div>
              {artifact.creator === character?.id && (
                <span className="creator-badge">Your Artifact</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(ArtifactDiscovery); 