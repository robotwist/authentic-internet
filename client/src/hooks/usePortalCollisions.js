import { useCallback } from "react";
import { TILE_SIZE, MAPS, getMapIndexByKey } from "../components/Constants";

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
    const currentMapName = MAPS[currentMapIndex]?.name || "";

    // Dedicated Overworld Yosemite shortcut portal (tile 19)
    if (
      currentMapName === "Overworld" &&
      MAPS[currentMapIndex]?.data?.[row]?.[col] === 19
    ) {
      const destinationIndex = getMapIndexByKey("Yosemite");
      if (destinationIndex !== -1) {
        setCurrentMapIndex(destinationIndex);
        setCharacterPosition({ x: 10 * TILE_SIZE, y: 42 * TILE_SIZE });
        adjustViewport({ x: 10 * TILE_SIZE, y: 42 * TILE_SIZE });

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
      return;
    }

    // Handle regular portals (type 5) for any map
    if (MAPS[currentMapIndex]?.data?.[row]?.[col] === 5) {
      // Handle different maps with different portal logic
      if (currentMapName === "Overworld") {
        // Transition to Overworld 2
        const destinationIndex = getMapIndexByKey("Overworld 2");
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
        const destinationIndex = getMapIndexByKey("Overworld 3");
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
        const destinationIndex = getMapIndexByKey("Desert 1");
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
        const destinationIndex = getMapIndexByKey("Desert 2");
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
        const destinationIndex = getMapIndexByKey("Desert 3");
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
        const destinationIndex = getMapIndexByKey("Dungeon Level 1");
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
        const destinationIndex = getMapIndexByKey("Dungeon Level 2");
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
        const destinationIndex = getMapIndexByKey("Dungeon Level 3");
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
        const destinationIndex = getMapIndexByKey("Yosemite");
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
          const destinationIndex = getMapIndexByKey("Overworld 3");
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

    // Yosemite mini-game sigils (tiles 6–8) are handled in GameWorld via
    // portalCollision dispatch (same pattern as dungeon tile 9).

    // Level 1 is completed via handlePortalTransition when reaching Yosemite.
    // Level 2: handleBossDefeat (Library of Alexandria). Level 3: handleTerminalComplete.
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
  ]);

  return { checkPortalCollisions };
};