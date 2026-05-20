import React, { useRef, useEffect, useCallback } from "react";
import { useCharacterMovement } from "../CharacterMovement";
import { TILE_SIZE } from "../Constants";

const INITIAL_CHARACTER_POSITION = { x: 64, y: 64 };

const CharacterController = React.forwardRef(
  (
    {
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
      characterState,
      transitionToNeighbor,
      /** Authoritative world position from GameWorld — keeps movement ref in sync after transitions / saves */
      characterPosition: worldCharacterPosition,
    },
    ref,
  ) => {
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

    const notifyWorldPosition = useCallback(
      (position, reason = "movement") => {
        if (onPositionChange) {
          onPositionChange(position, reason);
        }
      },
      [onPositionChange],
    );

    // Handle character move - updates ref and notifies GameWorld (same source of truth as React state)
    const handleCharacterMove = useCallback(
      (newPosition, targetMapIndex) => {
        characterPositionRef.current = newPosition;

        // Update style in ref
        characterStateRef.current.style = {
          ...characterStateRef.current.style,
          left: newPosition.x,
          top: newPosition.y,
        };

        if (characterRef.current) {
          characterRef.current.style.left = `${newPosition.x}px`;
          characterRef.current.style.top = `${newPosition.y}px`;
        }

        // Handle map transitions
        if (targetMapIndex !== currentMapIndex) {
          setCurrentMapIndex(targetMapIndex);
        }

        notifyWorldPosition(newPosition, "movement");
      },
      [currentMapIndex, setCurrentMapIndex, notifyWorldPosition],
    );

    // Keep local movement ref aligned when GameWorld sets position (neighbor transition, save load, teleport)
    useEffect(() => {
      if (
        !worldCharacterPosition ||
        typeof worldCharacterPosition.x !== "number" ||
        typeof worldCharacterPosition.y !== "number"
      ) {
        return;
      }
      const cur = characterPositionRef.current;
      if (
        cur.x === worldCharacterPosition.x &&
        cur.y === worldCharacterPosition.y
      ) {
        return;
      }
      characterPositionRef.current = {
        x: worldCharacterPosition.x,
        y: worldCharacterPosition.y,
      };
      characterStateRef.current.style = {
        ...characterStateRef.current.style,
        left: worldCharacterPosition.x,
        top: worldCharacterPosition.y,
      };
      if (adjustViewport && typeof adjustViewport === "function") {
        adjustViewport(worldCharacterPosition);
      }
    }, [worldCharacterPosition?.x, worldCharacterPosition?.y, adjustViewport]);

    // Portal collision handler
    useEffect(() => {
      const handlePortalCollision = () => {
        notifyWorldPosition(characterPositionRef.current, "portal");
      };

      window.addEventListener("portalCollision", handlePortalCollision);
      return () => {
        window.removeEventListener("portalCollision", handlePortalCollision);
      };
    }, [notifyWorldPosition]);

    // Character movement hook
    const characterMovement = useCharacterMovement(
      characterPositionRef,
      characterState,
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
      transitionToNeighbor,
    );

    // Initial viewport lock once layout exists (movement + sync effect handle updates afterward)
    useEffect(() => {
      if (adjustViewport && typeof adjustViewport === "function") {
        adjustViewport(characterPositionRef.current);
      }
    }, [adjustViewport, currentMapIndex]);

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
          stateUpdates.horizontalDirection =
            characterMovement.movementDirection;
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
    }, [
      characterMovement.movementDirection,
      characterMovement.diagonalMovement,
    ]);

    // Expose position, state, and movement for parent (e.g. mobile TouchControls)
    React.useImperativeHandle(
      ref,
      () => ({
        getPosition: () => characterPositionRef.current,
        getState: () => characterStateRef.current,
        getDirection: () => characterStateRef.current.direction,
        getIsHit: () => characterStateRef.current.isHit,
        handleMove: characterMovement.handleMove,
      }),
      [characterMovement.handleMove],
    );

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
  },
);

CharacterController.displayName = "CharacterController";

export default CharacterController;
