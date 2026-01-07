import React, { useRef, useEffect, useCallback, useState } from "react";
import { useCharacterMovement } from "../CharacterMovement";
import { TILE_SIZE } from "../Constants";

const INITIAL_CHARACTER_POSITION = { x: 64, y: 64 };

const CharacterController = React.forwardRef(({
  currentMapIndex,
  setCurrentMapIndex,
  isLoggedIn,
  visibleArtifact,
  handleArtifactPickup,
  setFormPosition,
  setShowInventory,
  adjustViewport,
  activePowers = [],
  user,
  uiState,
  isInvincible,
  onPositionChange,
}, ref) => {
  // Use refs for position and state to avoid re-renders
  const characterPositionRef = useRef(INITIAL_CHARACTER_POSITION);
  const characterStateRef = useRef({
    direction: "down",
    style: {
      left: 64,
      top: 64,
      width: TILE_SIZE,
      height: TILE_SIZE,
      transition: "left 0.2s, top 0.2s",
    },
    movementTransition: null,
    verticalDirection: null,
    horizontalDirection: null,
    isHit: false,
  });

  const characterRef = useRef(null);
  const lastPositionChangeTime = useRef(Date.now());

  // Throttled position change callback - only call when movement stops or significant events
  const throttledPositionChange = useCallback((position, reason = 'movement') => {
    const now = Date.now();
    const timeSinceLastChange = now - lastPositionChangeTime.current;

    // Always call for portal events, throttle position updates
    if (reason === 'portal' || timeSinceLastChange > 100) { // 100ms throttle
      lastPositionChangeTime.current = now;
      if (onPositionChange) {
        onPositionChange(position, reason);
      }
    }
  }, [onPositionChange]);

  // Handle character move - updates ref and calls throttled callback
  const handleCharacterMove = useCallback((newPosition, targetMapIndex) => {
    characterPositionRef.current = newPosition;

    // Update style in ref
    characterStateRef.current.style = {
      ...characterStateRef.current.style,
      left: newPosition.x,
      top: newPosition.y,
    };

    // Handle map transitions
    if (targetMapIndex !== currentMapIndex) {
      setCurrentMapIndex(targetMapIndex);
    }

    // Call throttled position change
    throttledPositionChange(newPosition, 'movement');
  }, [currentMapIndex, setCurrentMapIndex, throttledPositionChange]);

  // Portal collision handler
  useEffect(() => {
    const handlePortalCollision = (event) => {
      const { tileX, tileY, tileType } = event.detail;
      // Call position change for portal events
      throttledPositionChange(characterPositionRef.current, 'portal');
    };

    window.addEventListener("portalCollision", handlePortalCollision);
    return () => {
      window.removeEventListener("portalCollision", handlePortalCollision);
    };
  }, [throttledPositionChange]);

  // Character movement hook
  const characterMovement = useCharacterMovement(
    characterPositionRef.current,
    handleCharacterMove,
    currentMapIndex,
    setCurrentMapIndex,
    isLoggedIn,
    visibleArtifact,
    handleArtifactPickup,
    setFormPosition,
    setShowInventory,
    adjustViewport,
    activePowers,
  );

  // Update character style and viewport when position changes
  useEffect(() => {
    // Adjust viewport to follow character
    if (adjustViewport) {
      adjustViewport(characterPositionRef.current);
    }
  }, [adjustViewport]);

  // Update movement state based on characterMovement
  useEffect(() => {
    if (characterMovement.movementDirection) {
      const stateUpdates = {
        direction: characterMovement.movementDirection,
      };

      // Track vertical and horizontal components separately
      if (
        characterMovement.movementDirection === "up" ||
        characterMovement.movementDirection === "down"
      ) {
        stateUpdates.verticalDirection = characterMovement.movementDirection;
      } else if (
        characterMovement.movementDirection === "left" ||
        characterMovement.movementDirection === "right"
      ) {
        stateUpdates.horizontalDirection = characterMovement.movementDirection;
      }

      // Process diagonal movement
      if (characterMovement.diagonalMovement) {
        if (characterMovement.diagonalMovement.y < 0) {
          stateUpdates.verticalDirection = "up";
        } else if (characterMovement.diagonalMovement.y > 0) {
          stateUpdates.verticalDirection = "down";
        }

        if (characterMovement.diagonalMovement.x < 0) {
          stateUpdates.horizontalDirection = "left";
        } else if (characterMovement.diagonalMovement.x > 0) {
          stateUpdates.horizontalDirection = "right";
        }
      }

      stateUpdates.movementTransition = "start-move";

      // Update ref
      characterStateRef.current = {
        ...characterStateRef.current,
        ...stateUpdates,
      };

      // After start animation, set to walking
      const walkTimeout = setTimeout(() => {
        characterStateRef.current = {
          ...characterStateRef.current,
          isMoving: true,
          movementTransition: null,
        };
      }, 50);

      return () => clearTimeout(walkTimeout);
    }
  }, [characterMovement.movementDirection, characterMovement.diagonalMovement]);


  // Expose position and state through ref
  React.useImperativeHandle(ref, () => ({
    getPosition: () => characterPositionRef.current,
    getState: () => characterStateRef.current,
    getDirection: () => characterStateRef.current.direction,
    getIsHit: () => characterStateRef.current.isHit,
  }), []);

  // Get current position for rendering
  const currentPosition = characterPositionRef.current;
  const currentState = characterStateRef.current;

  return (
    <div
      className={`character ${uiState?.isMoving ? "walking" : ""} ${currentState.direction} ${currentState.verticalDirection !== currentState.direction && currentState.verticalDirection ? currentState.verticalDirection : ""} ${currentState.horizontalDirection !== currentState.direction && currentState.horizontalDirection ? currentState.horizontalDirection : ""} ${currentState.movementTransition || ""} ${isInvincible ? "character-invincible" : ""} ${currentState.isHit ? "character-hit" : ""}`}
      style={{
        ...currentState.style,
        // Use custom character sprite if available, otherwise fallback to default
        ...(user?.characterSprite
          ? {
              background: `url(${user.characterSprite}) no-repeat center center`,
              backgroundSize: "cover",
              imageRendering: "pixelated",
            }
          : {}),
      }}
      ref={characterRef}
      role="img"
      aria-label={`${user?.characterName || "Player"} at position ${Math.round(currentPosition.x / TILE_SIZE)}, ${Math.round(currentPosition.y / TILE_SIZE)}`}
      data-testid="character"
    />
  );
});

CharacterController.displayName = 'CharacterController';

export default CharacterController;