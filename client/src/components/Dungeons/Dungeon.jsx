import React, { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import "./Dungeon.css";
import {
  getTileFromChar,
  isWalkableTile,
  isLockedDoor,
  DUNGEON_TILES,
} from "./DungeonData";
import Enemy from "../Combat/Enemy";
import Boss from "../Combat/Boss";

const TILE_SIZE = 64; // Same as overworld

/**
 * Dungeon Component
 *
 * Renders dungeon rooms similar to The Legend of Zelda:
 * - Single room visible at a time
 * - Doors transition between rooms
 * - Locked doors require keys
 * - Boss rooms have special encounters
 */
const Dungeon = ({
  dungeonData,
  playerPosition,
  onPlayerMove,
  onCollectItem,
  onEnemyDefeat,
  onBossDefeat,
  onExit,
  playerKeys,
  hasBossKey,
  characterRef,
}) => {
  const [currentRoom, setCurrentRoom] = useState(dungeonData.rooms.entrance);
  const [roomEnemies, setRoomEnemies] = useState([]);
  const [defeatedRooms, setDefeatedRooms] = useState(new Set());
  const [collectedItems, setCollectedItems] = useState(new Set());
  const [unlockedDoors, setUnlockedDoors] = useState(new Set());
  const [bossDefeated, setBossDefeated] = useState(false);

  const dungeonRef = useRef(null);

  // Initialize current room enemies
  useEffect(() => {
    if (currentRoom.enemies && currentRoom.enemies.length > 0) {
      // Only spawn enemies if room hasn't been cleared
      if (!defeatedRooms.has(currentRoom.id)) {
        setRoomEnemies(
          currentRoom.enemies.map((enemy, index) => ({
            ...enemy,
            id: `${currentRoom.id}_enemy_${index}`,
            health: getEnemyHealth(enemy.type),
          })),
        );
      } else {
        setRoomEnemies([]);
      }
    } else {
      setRoomEnemies([]);
    }
  }, [currentRoom, defeatedRooms]);

  // Check for door interaction when player moves
  useEffect(() => {
    checkDoorInteraction(playerPosition.x, playerPosition.y);
  }, [playerPosition, checkDoorInteraction]);

  // Get enemy health based on type
  const getEnemyHealth = (type) => {
    const healthMap = {
      keese_dungeon: 1,
      stalfos_dungeon: 3,
      darknut: 5,
      wizzrobe: 4,
      bubble: 999, // Invincible
      wallmaster: 4,
    };
    return healthMap[type] || 2;
  };

  // Handle enemy defeat
  const handleEnemyDefeat = useCallback(
    (enemyId, drops) => {
      setRoomEnemies((prev) => {
        const updated = prev.filter((e) => e.id !== enemyId);

        // If all enemies defeated, mark room as cleared
        if (updated.length === 0 && !defeatedRooms.has(currentRoom.id)) {
          setDefeatedRooms((prev) => new Set([...prev, currentRoom.id]));

          // Spawn room items (keys, etc.)
          if (currentRoom.items && currentRoom.items.length > 0) {
            currentRoom.items.forEach((item) => {
              if (!item.inChest) {
                // Item appears when enemies defeated
                console.log(`Room cleared! ${item.type} appeared.`);
              }
            });
          }
        }

        return updated;
      });

      if (onEnemyDefeat) {
        onEnemyDefeat(enemyId, drops);
      }
    },
    [currentRoom, defeatedRooms, onEnemyDefeat],
  );

  // Handle boss defeat
  const handleBossDefeat = useCallback(() => {
    setBossDefeated(true);
    setDefeatedRooms((prev) => new Set([...prev, currentRoom.id]));

    if (onBossDefeat) {
      onBossDefeat(dungeonData.id);
    }

    // Reveal treasure
    console.log("🏆 Boss defeated! Treasure revealed!");
  }, [currentRoom, dungeonData.id, onBossDefeat]);

  // Handle item collection
  const handleItemCollection = useCallback(
    (itemType, itemId) => {
      if (collectedItems.has(itemId)) return;

      setCollectedItems((prev) => new Set([...prev, itemId]));

      if (onCollectItem) {
        onCollectItem(itemType);
      }

      console.log(`Collected: ${itemType}`);
    },
    [collectedItems, onCollectItem],
  );

  // Check door interaction - called when player moves
  const checkDoorInteraction = useCallback(
    (newX, newY) => {
      const tileX = Math.floor(newX / TILE_SIZE);
      const tileY = Math.floor(newY / TILE_SIZE);

      // Check if player is at a door
      Object.entries(currentRoom.doors || {}).forEach(
        ([direction, doorData]) => {
          let isDoorTile = false;

          // Check door position based on direction
          if (
            direction === "north" &&
            tileY === 0 &&
            tileX === Math.floor(currentRoom.width / 2)
          ) {
            isDoorTile = true;
          } else if (
            direction === "south" &&
            tileY === currentRoom.height - 1 &&
            tileX === Math.floor(currentRoom.width / 2)
          ) {
            isDoorTile = true;
          } else if (
            direction === "east" &&
            tileX === currentRoom.width - 1 &&
            tileY === Math.floor(currentRoom.height / 2)
          ) {
            isDoorTile = true;
          } else if (
            direction === "west" &&
            tileX === 0 &&
            tileY === Math.floor(currentRoom.height / 2)
          ) {
            isDoorTile = true;
          }

          if (isDoorTile) {
            const doorKey = `${currentRoom.id}_${direction}`;

            // Check if door is already unlocked
            if (unlockedDoors.has(doorKey)) {
              console.log("🚪 Door already unlocked, transitioning...");
              transitionToRoom(doorData.leadsTo, direction);
              return;
            }

            // Check if door is locked
            if (doorData.locked) {
              if (doorData.requiresBossKey) {
                if (hasBossKey) {
                  // Use boss key (permanent unlock)
                  console.log("🗝️ Boss key used!");
                  setUnlockedDoors((prev) => new Set([...prev, doorKey]));
                  transitionToRoom(doorData.leadsTo, direction);
                } else {
                  console.log("🔒 This door requires a Boss Key!");
                }
              } else if (doorData.requiresKey) {
                if (playerKeys > 0) {
                  // Use small key (consumes one key)
                  console.log(
                    `🔑 Small key used! Remaining keys: ${playerKeys - 1}`,
                  );
                  setUnlockedDoors((prev) => new Set([...prev, doorKey]));
                  transitionToRoom(doorData.leadsTo, direction);
                  // Notify parent to decrement key count
                  if (onCollectItem) {
                    onCollectItem("use_small_key");
                  }
                } else {
                  console.log("🔒 This door is locked! Need a small key.");
                }
              }
            } else {
              // Door is unlocked, transition
              transitionToRoom(doorData.leadsTo, direction);
            }
          }
        },
      );
    },
    [currentRoom, playerKeys, hasBossKey, unlockedDoors, onCollectItem],
  );

  // Transition to new room
  const transitionToRoom = useCallback(
    (roomId, entryDirection) => {
      if (roomId === "overworld_exit") {
        // Exit dungeon
        if (onExit) {
          onExit();
        }
        return;
      }

      const newRoom = dungeonData.rooms[roomId];
      if (!newRoom) {
        console.error(`Room not found: ${roomId}`);
        return;
      }

      setCurrentRoom(newRoom);

      // Position player at appropriate entrance
      const oppositeDirection = {
        north: "south",
        south: "north",
        east: "west",
        west: "east",
      };

      const entrySide = oppositeDirection[entryDirection];
      let newPlayerX, newPlayerY;

      // Calculate spawn position based on entry direction
      if (entrySide === "north") {
        newPlayerX = Math.floor(newRoom.width / 2) * TILE_SIZE;
        newPlayerY = TILE_SIZE;
      } else if (entrySide === "south") {
        newPlayerX = Math.floor(newRoom.width / 2) * TILE_SIZE;
        newPlayerY = (newRoom.height - 2) * TILE_SIZE;
      } else if (entrySide === "east") {
        newPlayerX = (newRoom.width - 2) * TILE_SIZE;
        newPlayerY = Math.floor(newRoom.height / 2) * TILE_SIZE;
      } else if (entrySide === "west") {
        newPlayerX = TILE_SIZE;
        newPlayerY = Math.floor(newRoom.height / 2) * TILE_SIZE;
      } else {
        // Default to room start position
        newPlayerX = newRoom.startPosition.x * TILE_SIZE;
        newPlayerY = newRoom.startPosition.y * TILE_SIZE;
      }

      if (onPlayerMove) {
        onPlayerMove({ x: newPlayerX, y: newPlayerY });
      }

      console.log(`Entered: ${newRoom.name}`);
    },
    [dungeonData, onPlayerMove, onExit],
  );

  // Render dungeon tiles
  const renderRoom = () => {
    if (!currentRoom) return null;

    const tiles = [];

    // Parse layout string into tiles
    for (let y = 0; y < currentRoom.layout.length; y++) {
      const row = currentRoom.layout[y];
      for (let x = 0; x < row.length; x++) {
        const char = row[x];
        const tileType = getTileFromChar(char);

        tiles.push(
          <div
            key={`tile-${x}-${y}`}
            className={`dungeon-tile ${tileType}`}
            style={{
              left: x * TILE_SIZE,
              top: y * TILE_SIZE,
              width: TILE_SIZE,
              height: TILE_SIZE,
            }}
            data-tile-type={tileType}
          />,
        );
      }
    }

    return tiles;
  };

  // Render room items
  const renderItems = () => {
    if (!currentRoom.items) return null;

    return currentRoom.items
      .filter((item) => {
        const itemId = `${currentRoom.id}_${item.type}_${item.position.x}_${item.position.y}`;
        // Show item if room is cleared and not collected
        const roomCleared =
          defeatedRooms.has(currentRoom.id) ||
          !currentRoom.enemies ||
          currentRoom.enemies.length === 0;
        return roomCleared && !collectedItems.has(itemId);
      })
      .map((item, index) => {
        const itemId = `${currentRoom.id}_${item.type}_${item.position.x}_${item.position.y}`;
        return (
          <div
            key={`item-${index}`}
            className={`dungeon-item ${item.type}`}
            style={{
              left: item.position.x * TILE_SIZE,
              top: item.position.y * TILE_SIZE,
              width: TILE_SIZE,
              height: TILE_SIZE,
            }}
            onClick={() => handleItemCollection(item.type, itemId)}
          >
            {getItemIcon(item.type)}
          </div>
        );
      });
  };

  // Get item icon
  const getItemIcon = (type) => {
    const icons = {
      small_key: "🔑",
      boss_key: "🗝️",
      heart_container: "❤️",
      compass: "🧭",
      white_sword: "⚔️",
      map: "🗺️",
    };
    return icons[type] || "💎";
  };

  // Render enemies
  const renderEnemies = () => {
    return roomEnemies.map((enemy) => (
      <Enemy
        key={enemy.id}
        id={enemy.id}
        type={enemy.type}
        initialPosition={enemy.position}
        initialHealth={enemy.health}
        playerPosition={playerPosition}
        onDefeat={(drops) => handleEnemyDefeat(enemy.id, drops)}
        mapBounds={{
          width: currentRoom.width * TILE_SIZE,
          height: currentRoom.height * TILE_SIZE,
        }}
      />
    ));
  };

  // Render boss
  const renderBoss = () => {
    if (!currentRoom.isBossRoom || bossDefeated) return null;
    if (!currentRoom.boss) return null;

    return (
      <Boss
        bossData={currentRoom.boss}
        initialPosition={{
          x: currentRoom.boss.position.x * TILE_SIZE,
          y: currentRoom.boss.position.y * TILE_SIZE,
        }}
        playerPosition={playerPosition}
        onDefeat={handleBossDefeat}
        onAttack={(pattern, bossPos, playerPos) => {
          console.log(`Boss attack: ${pattern}`);
          // Boss attack logic would go here
          // For now, just log it
        }}
      />
    );
  };

  return (
    <div
      className="dungeon-container"
      ref={dungeonRef}
      style={{
        width: currentRoom.width * TILE_SIZE,
        height: currentRoom.height * TILE_SIZE,
      }}
    >
      <div className="dungeon-room">
        {/* Room tiles */}
        {renderRoom()}

        {/* Items */}
        {renderItems()}

        {/* Enemies */}
        {renderEnemies()}

        {/* Boss */}
        {renderBoss()}

        {/* Room name overlay */}
        <div className="room-name-overlay">{currentRoom.name}</div>
      </div>
    </div>
  );
};

Dungeon.propTypes = {
  dungeonData: PropTypes.object.isRequired,
  playerPosition: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  onPlayerMove: PropTypes.func,
  onCollectItem: PropTypes.func,
  onEnemyDefeat: PropTypes.func,
  onBossDefeat: PropTypes.func,
  onExit: PropTypes.func,
  playerKeys: PropTypes.number,
  hasBossKey: PropTypes.bool,
  characterRef: PropTypes.object,
};

Dungeon.defaultProps = {
  playerKeys: 0,
  hasBossKey: false,
};

export default Dungeon;
