import { useCallback } from "react";
import { TILE_SIZE, MAPS } from "../components/Constants";

export const usePortalCollisions = ({
  characterPosition,
  currentMapIndex,
  soundManager,
  portalNotificationActive,
  setPortalNotificationActive,
  showPortalNotification,
  hidePortalNotification,
  createInteractiveNotification,
  setCurrentMapIndex,
  setCharacterPosition,
  adjustViewport,
  setCurrentSpecialWorld,
  gameData,
  handleLevelCompletion,
}) => {
  const checkPortalCollisions = useCallback(() => {
    if (!characterPosition) return;

    const row = Math.floor(characterPosition.y / TILE_SIZE);
    const col = Math.floor(characterPosition.x / TILE_SIZE);

    // Handle regular portals (type 5) for any map
    if (MAPS[currentMapIndex]?.data?.[row]?.[col] === 5) {
      const currentMapName = MAPS[currentMapIndex]?.name || "";

      // Handle different maps with different portal logic
      if (currentMapName === "Overworld 1") {
        // Transition to Overworld 2
        const destinationIndex = MAPS.findIndex(
          (map) => map.name === "Overworld 2",
        );
        if (destinationIndex !== -1) {
          setCurrentMapIndex(destinationIndex);
          setCharacterPosition({ x: 64, y: 64 });
          adjustViewport({ x: 64, y: 64 });

          // Announce the world name
          const portalAnnouncement = document.createElement("div");
          portalAnnouncement.className = "world-announcement";
          portalAnnouncement.innerHTML = `<h2>Welcome to Overworld 2</h2>`;
          document.body.appendChild(portalAnnouncement);

          setTimeout(() => {
            portalAnnouncement.classList.add("fade-out");
            setTimeout(() => {
              document.body.removeChild(portalAnnouncement);
            }, 1000);
          }, 3000);
        }
      } else if (currentMapName === "Overworld 2") {
        // Transition to Overworld 3
        const destinationIndex = MAPS.findIndex(
          (map) => map.name === "Overworld 3",
        );
        if (destinationIndex !== -1) {
          setCurrentMapIndex(destinationIndex);
          setCharacterPosition({ x: 64, y: 64 });
          adjustViewport({ x: 64, y: 64 });

          // Announce the world name
          const portalAnnouncement = document.createElement("div");
          portalAnnouncement.className = "world-announcement";
          portalAnnouncement.innerHTML = `<h2>Welcome to Overworld 3</h2>`;
          document.body.appendChild(portalAnnouncement);

          setTimeout(() => {
            portalAnnouncement.classList.add("fade-out");
            setTimeout(() => {
              document.body.removeChild(portalAnnouncement);
            }, 1000);
          }, 3000);
        }
      } else if (currentMapName === "Overworld 3") {
        // Transition to Desert 1
        const destinationIndex = MAPS.findIndex(
          (map) => map.name === "Desert 1",
        );
        if (destinationIndex !== -1) {
          setCurrentMapIndex(destinationIndex);
          setCharacterPosition({ x: 64, y: 64 });
          adjustViewport({ x: 64, y: 64 });

          // Announce the world name
          const portalAnnouncement = document.createElement("div");
          portalAnnouncement.className = "world-announcement";
          portalAnnouncement.innerHTML = `<h2>Welcome to Desert 1</h2>`;
          document.body.appendChild(portalAnnouncement);

          setTimeout(() => {
            portalAnnouncement.classList.add("fade-out");
            setTimeout(() => {
              document.body.removeChild(portalAnnouncement);
            }, 1000);
          }, 3000);
        }
      } else if (currentMapName === "Desert 1") {
        // Transition to Desert 2
        const destinationIndex = MAPS.findIndex(
          (map) => map.name === "Desert 2",
        );
        if (destinationIndex !== -1) {
          setCurrentMapIndex(destinationIndex);
          setCharacterPosition({ x: 64, y: 64 });
          adjustViewport({ x: 64, y: 64 });

          // Announce the world name
          const portalAnnouncement = document.createElement("div");
          portalAnnouncement.className = "world-announcement";
          portalAnnouncement.innerHTML = `<h2>Welcome to Desert 2</h2>`;
          document.body.appendChild(portalAnnouncement);

          setTimeout(() => {
            portalAnnouncement.classList.add("fade-out");
            setTimeout(() => {
              document.body.removeChild(portalAnnouncement);
            }, 1000);
          }, 3000);
        }
      } else if (currentMapName === "Desert 2") {
        // Transition to Desert 3
        const destinationIndex = MAPS.findIndex(
          (map) => map.name === "Desert 3",
        );
        if (destinationIndex !== -1) {
          setCurrentMapIndex(destinationIndex);
          setCharacterPosition({ x: 64, y: 64 });
          adjustViewport({ x: 64, y: 64 });

          // Announce the world name
          const portalAnnouncement = document.createElement("div");
          portalAnnouncement.className = "world-announcement";
          portalAnnouncement.innerHTML = `<h2>Welcome to Desert 3</h2>`;
          document.body.appendChild(portalAnnouncement);

          setTimeout(() => {
            portalAnnouncement.classList.add("fade-out");
            setTimeout(() => {
              document.body.removeChild(portalAnnouncement);
            }, 1000);
          }, 3000);
        }
      } else if (currentMapName === "Desert 3") {
        // Transition to Dungeon Level 1
        const destinationIndex = MAPS.findIndex(
          (map) => map.name === "Dungeon Level 1",
        );
        if (destinationIndex !== -1) {
          setCurrentMapIndex(destinationIndex);
          setCharacterPosition({ x: 64, y: 64 });
          adjustViewport({ x: 64, y: 64 });

          // Announce the world name
          const portalAnnouncement = document.createElement("div");
          portalAnnouncement.className = "world-announcement";
          portalAnnouncement.innerHTML = `<h2>Welcome to Dungeon Level 1</h2>`;
          document.body.appendChild(portalAnnouncement);

          setTimeout(() => {
            portalAnnouncement.classList.add("fade-out");
            setTimeout(() => {
              document.body.removeChild(portalAnnouncement);
            }, 1000);
          }, 3000);
        }
      } else if (currentMapName === "Dungeon Level 1") {
        // Transition to Dungeon Level 2
        const destinationIndex = MAPS.findIndex(
          (map) => map.name === "Dungeon Level 2",
        );
        if (destinationIndex !== -1) {
          setCurrentMapIndex(destinationIndex);
          setCharacterPosition({ x: 64, y: 64 });
          adjustViewport({ x: 64, y: 64 });

          // Announce the world name
          const portalAnnouncement = document.createElement("div");
          portalAnnouncement.className = "world-announcement";
          portalAnnouncement.innerHTML = `<h2>Welcome to Dungeon Level 2</h2>`;
          document.body.appendChild(portalAnnouncement);

          setTimeout(() => {
            portalAnnouncement.classList.add("fade-out");
            setTimeout(() => {
              document.body.removeChild(portalAnnouncement);
            }, 1000);
          }, 3000);
        }
      } else if (currentMapName === "Dungeon Level 2") {
        // Transition to Dungeon Level 3
        const destinationIndex = MAPS.findIndex(
          (map) => map.name === "Dungeon Level 3",
        );
        if (destinationIndex !== -1) {
          setCurrentMapIndex(destinationIndex);
          setCharacterPosition({ x: 64, y: 64 });
          adjustViewport({ x: 64, y: 64 });

          // Announce the world name
          const portalAnnouncement = document.createElement("div");
          portalAnnouncement.className = "world-announcement";
          portalAnnouncement.innerHTML = `<h2>Welcome to Dungeon Level 3</h2>`;
          document.body.appendChild(portalAnnouncement);

          setTimeout(() => {
            portalAnnouncement.classList.add("fade-out");
            setTimeout(() => {
              document.body.removeChild(portalAnnouncement);
            }, 1000);
          }, 3000);
        }
      } else if (currentMapName === "Dungeon Level 3") {
        // Transition to Yosemite
        const destinationIndex = MAPS.findIndex(
          (map) => map.name === "Yosemite",
        );
        if (destinationIndex !== -1) {
          setCurrentMapIndex(destinationIndex);
          setCharacterPosition({ x: 64, y: 64 });
          adjustViewport({ x: 64, y: 64 });

          // Announce the world name
          const portalAnnouncement = document.createElement("div");
          portalAnnouncement.className = "world-announcement";
          portalAnnouncement.innerHTML = `<h2>Welcome to Yosemite</h2>`;
          document.body.appendChild(portalAnnouncement);

          setTimeout(() => {
            portalAnnouncement.classList.add("fade-out");
            setTimeout(() => {
              document.body.removeChild(portalAnnouncement);
            }, 1000);
          }, 3000);
        }
      }

      // For Yosemite map, handle type 5 portal specially to return to Overworld 3
      else if (currentMapName === "Yosemite") {
        const conditionFn = () =>
          MAPS[currentMapIndex]?.data?.[row]?.[col] === 5 &&
          currentMapName === "Yosemite";

        const actionFn = () => {
          // Find Overworld 3 map index
          const destinationIndex = MAPS.findIndex(
            (map) => map.name === "Overworld 3",
          );
          if (destinationIndex !== -1) {
            // Change map to Overworld 3
            setCurrentMapIndex(destinationIndex);
            // Set character position near the portal to Yosemite
            setCharacterPosition({ x: 8, y: 2 });

            // Announce the world name
            const portalAnnouncement = document.createElement("div");
            portalAnnouncement.className = "world-announcement";
            portalAnnouncement.innerHTML =
              "<h2>Welcome back to Overworld 3</h2>";
            document.body.appendChild(portalAnnouncement);

            // Remove the announcement after a few seconds
            setTimeout(() => {
              portalAnnouncement.classList.add("fade-out");
              setTimeout(() => {
                document.body.removeChild(portalAnnouncement);
              }, 1000);
            }, 3000);
          } else {
            console.error("Destination map Overworld 3 not found");
          }
        };

        createInteractiveNotification(
          "Return to Overworld 3",
          "Press SPACE to return to Overworld 3",
          conditionFn,
          actionFn,
        );
      }
    }

    // Handle special portals in Yosemite map
    const currentMapName = MAPS[currentMapIndex]?.name || "";
    if (currentMapName === "Yosemite") {
      // Terminal portal (code 6)
      if (MAPS[currentMapIndex]?.data?.[row]?.[col] === 6) {
        const conditionFn = () =>
          MAPS[currentMapIndex]?.data?.[row]?.[col] === 6 &&
          currentMapName === "Yosemite";

        const actionFn = () => {
          // Stop Yosemite music first
          if (soundManager) {
            soundManager.stopMusic(true);
          }
          // Launch terminal special world
          setCurrentSpecialWorld("terminal");
        };

        createInteractiveNotification(
          "Mysterious Portal",
          "Press SPACE to investigate this strange energy",
          conditionFn,
          actionFn,
        );
      }

      // Shooter portal (code 7)
      else if (MAPS[currentMapIndex]?.data?.[row]?.[col] === 7) {
        const conditionFn = () =>
          MAPS[currentMapIndex]?.data?.[row]?.[col] === 7 &&
          currentMapName === "Yosemite";

        const actionFn = () => {
          console.log("SHOOTER PORTAL: Launching shooter");
          // Stop Yosemite music first
          if (soundManager) {
            soundManager.stopMusic(true);
          }
          // Launch shooter special world
          setCurrentSpecialWorld("shooter");
        };

        createInteractiveNotification(
          "Mysterious Portal",
          "Press SPACE to investigate this strange energy",
          conditionFn,
          actionFn,
        );
      }

      // Text Adventure portal (code 8)
      else if (MAPS[currentMapIndex]?.data?.[row]?.[col] === 8) {
        const conditionFn = () =>
          MAPS[currentMapIndex]?.data?.[row]?.[col] === 8 &&
          currentMapName === "Yosemite";

        const actionFn = () => {
          // Stop Yosemite music first
          if (soundManager) {
            soundManager.stopMusic(true);
          }
          // Launch text adventure special world
          setCurrentSpecialWorld("text_adventure");
        };

        createInteractiveNotification(
          "Mysterious Portal",
          "Press SPACE to investigate this strange energy",
          conditionFn,
          actionFn,
        );
      } else {
        // Reset portal notification when not on a special portal
        if (portalNotificationActive) {
          hidePortalNotification();
          setPortalNotificationActive(false);
        }
      }
    }

    // Legacy level completion logic (for backwards compatibility)
    if (currentMapIndex === 1 && row === 0 && col === 19) {
      handleLevelCompletion("level2");
    } else if (
      currentMapIndex === 2 &&
      !gameData.levelCompletion.level3 &&
      character?.qualifyingArtifacts?.level3
    ) {
      handleLevelCompletion("level3");
    }
  }, [
    characterPosition,
    currentMapIndex,
    soundManager,
    portalNotificationActive,
    setPortalNotificationActive,
    showPortalNotification,
    hidePortalNotification,
    createInteractiveNotification,
    setCurrentMapIndex,
    setCharacterPosition,
    adjustViewport,
    setCurrentSpecialWorld,
    gameData.levelCompletion,
    handleLevelCompletion,
  ]);

  return { checkPortalCollisions };
};