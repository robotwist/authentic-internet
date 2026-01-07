import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import VictoryScreen from "./VictoryScreen";
import "./Level4Shooter.css";

const Level4Shooter = ({ onComplete, onExit, character }) => {
  console.log("Level4Shooter component initializing");

  // Game state
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [score, setScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState("paris"); // 'paris', 'spain', 'africa'
  const [storyProgress, setStoryProgress] = useState(0); // Track story progress
  const [showQuote, setShowQuote] = useState(false);
  const [currentQuote, setCurrentQuote] = useState({ text: "", author: "" });

  // Player state
  const [playerPosition, setPlayerPosition] = useState({ x: 100, y: 300 });
  const [playerVelocity, setPlayerVelocity] = useState({ x: 0, y: 0 });
  const [playerHealth, setPlayerHealth] = useState(100);
  const [isJumping, setIsJumping] = useState(false);
  const [isFacingRight, setIsFacingRight] = useState(true);
  const [playerLevelDanger, setPlayerLevelDanger] = useState(1);

  // Shooting state (Contra-style)
  const [playerBullets, setPlayerBullets] = useState([]);
  const [weaponType, setWeaponType] = useState("normal"); // 'normal', 'spread'
  const [canShoot, setCanShoot] = useState(true);
  const [shootCooldown, setShootCooldown] = useState(0);
  const shootDirectionKeys = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  // Jump state (Mario-style variable height)
  const jumpStartTimeRef = useRef(null);
  const jumpPressedRef = useRef(false);
  const maxJumpHoldTime = 250; // milliseconds

  // Enemy state
  const [enemies, setEnemies] = useState([]);
  const [enemyBullets, setEnemyBullets] = useState([]);

  // Hemingway companion state
  const [hemingwayActive, setHemingwayActive] = useState(false);
  const [hemingwayPosition, setHemingwayPosition] = useState({
    x: 150,
    y: 300,
  });
  const [hemingwayHealth, setHemingwayHealth] = useState(100);
  const [hemingwayDialog, setHemingwayDialog] = useState("");
  const [showHemingwayDialog, setShowHemingwayDialog] = useState(false);

  // Camera and world state
  const [cameraOffset, setCameraOffset] = useState(0);
  const [levelWidth, setLevelWidth] = useState(3000); // Total level width

  // Game objects - Mario-style platform layout
  const [platforms, setPlatforms] = useState([
    { x: 0, y: 350, width: 1200, height: 50, type: "ground" },
    // First set of platforms (easy jumps)
    { x: 400, y: 280, width: 150, height: 20, type: "platform" },
    { x: 650, y: 240, width: 120, height: 20, type: "platform" },
    { x: 850, y: 200, width: 100, height: 20, type: "platform" },
    // Gap section with platforms
    { x: 1100, y: 350, width: 200, height: 50, type: "ground" },
    { x: 1350, y: 300, width: 100, height: 20, type: "platform" },
    { x: 1500, y: 250, width: 120, height: 20, type: "platform" },
    { x: 1650, y: 200, width: 100, height: 20, type: "platform" },
    // Mid-section ground
    { x: 1800, y: 350, width: 300, height: 50, type: "ground" },
    // Upper platforms challenge
    { x: 2100, y: 280, width: 120, height: 20, type: "platform" },
    { x: 2250, y: 240, width: 100, height: 20, type: "platform" },
    { x: 2400, y: 200, width: 150, height: 20, type: "platform" },
    // Final section
    { x: 2600, y: 350, width: 400, height: 50, type: "ground" },
    { x: 2800, y: 300, width: 200, height: 50, type: "end-platform" },
  ]);

  // Collectibles and items
  const [collectibles, setCollectibles] = useState([
    { id: 1, x: 400, y: 230, type: "health", collected: false },
    { id: 2, x: 800, y: 180, type: "manuscript", collected: false },
    { id: 3, x: 1200, y: 260, type: "weapon", collected: false },
    { id: 4, x: 1600, y: 200, type: "manuscript", collected: false },
    { id: 5, x: 2000, y: 280, type: "health", collected: false },
    { id: 6, x: 2400, y: 180, type: "manuscript", collected: false },
  ]);

  // Game settings - Mario-style physics (tuned for authentic feel)
  const GRAVITY = 0.7; // Snappy gravity for responsive platforming
  const JUMP_FORCE = -15; // Strong jump force for satisfying jumps
  const JUMP_FORCE_MAX = -18; // Maximum jump force (variable jump)
  const PLAYER_ACCELERATION = 0.6; // Responsive acceleration
  const PLAYER_DECELERATION = 0.5; // Quick deceleration for tight control
  const PLAYER_MAX_SPEED = 6; // Faster max speed for action feel
  const SCROLL_MARGIN = 300; // Distance from edge of screen to start scrolling

  // Contra-style shooting settings (tuned for run-and-gun feel)
  const BULLET_SPEED = 14; // Fast bullets for responsive combat
  const BULLET_LIFETIME = 2000; // 2 seconds
  const SHOOT_COOLDOWN_TIME = 120; // Faster shooting for action feel (normal)
  const SPREAD_SHOOT_COOLDOWN = 180; // Slightly slower for spread gun (spread gun is slower)

  // Refs for animation frame and game loop
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const keysPressed = useRef({});

  // Sound effects
  const playerImageRef = useRef(null);
  const hemingwayImageRef = useRef(null);

  // Story quotes from Hemingway
  const hemingwayQuotes = [
    {
      text: "The world breaks everyone and afterward many are strong at the broken places.",
      author: "Ernest Hemingway, A Farewell to Arms",
    },
    {
      text: "There is nothing to writing. All you do is sit down at a typewriter and bleed.",
      author: "Ernest Hemingway",
    },
    {
      text: "But man is not made for defeat. A man can be destroyed but not defeated.",
      author: "Ernest Hemingway, The Old Man and the Sea",
    },
    {
      text: "All things truly wicked start from innocence.",
      author: "Ernest Hemingway, A Moveable Feast",
    },
  ];

  // Level descriptions
  const levelDescriptions = {
    paris: "Paris, 1920s - The Lost Generation",
    spain: "Spain, 1930s - The Spanish Civil War",
    africa: "Africa, 1950s - The Final Safari",
  };

  // Initialize canvas
  const initializeCanvas = () => {
    try {
      if (!canvasRef.current) {
        console.error("Canvas ref is null");
        return null;
      }

      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) {
        console.error("Failed to get 2D context");
        return null;
      }

      return ctx;
    } catch (error) {
      console.error("Error initializing canvas:", error);
      return null;
    }
  };

  // Main game loop with performance timing
  const gameLoop = (timestamp) => {
    try {
      // Calculate delta time for smooth animation at any frame rate
      const deltaTime = timestamp - lastFrameTimeRef.current;
      const delta = Math.min(deltaTime / 16.67, 2); // Normalize to ~60 FPS (16.67ms per frame), cap at 2x
      lastFrameTimeRef.current = timestamp;

      if (isGameActive && !gameOver) {
        // Update game state
        updateGameState(delta);
      }

      // Render the game (always render even if game is not active to show current state)
      renderGame();

      // Continue the game loop
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } catch (error) {
      console.error("Error in game loop:", error);
      // Try to recover
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  };

  // Initialize images
  useEffect(() => {
    console.log("Initializing game resources...");

    // Emergency backup tick to ensure updates happen even if requestAnimationFrame fails
    let backupInterval = null;

    // Preload player image
    playerImageRef.current = new Image();
    playerImageRef.current.src = "/assets/player.png";
    playerImageRef.current.onload = () =>
      console.log("Player image loaded successfully");
    playerImageRef.current.onerror = (e) => {
      console.error("Error loading player image:", e);
      // Try alternate path
      playerImageRef.current.src = "/public/assets/player.png";
    };

    // Preload Hemingway image
    hemingwayImageRef.current = new Image();
    hemingwayImageRef.current.src = "/assets/hemingway.png";
    hemingwayImageRef.current.onload = () =>
      console.log("Hemingway image loaded successfully");
    hemingwayImageRef.current.onerror = (e) => {
      console.error("Error loading Hemingway image:", e);
      // Try alternate path
      hemingwayImageRef.current.src = "/public/assets/hemingway.png";
    };

    // Setup keyboard events
    const handleKeyDown = (e) => {
      console.log(`Shooter Game - Key pressed: ${e.key}`);

      // Capture ALL game-related keys and prevent them from bubbling up
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "w",
          "a",
          "s",
          "d",
          " ",
          "Escape",
        ].includes(e.key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }

      keysPressed.current[e.key] = true;

      // Handle jump (Mario-style variable height jump) - only if on ground
      const onGround = checkOnGround(playerPosition);
      if ((e.key === "ArrowUp" || e.key === "w") && onGround && !isJumping) {
        jumpStartTimeRef.current = performance.now();
        jumpPressedRef.current = true;
        jump();
      }

      // Track shooting direction keys (for when shooting while in air)
      if (e.key === "ArrowUp" || e.key === "w") {
        shootDirectionKeys.current.up = true;
      }
      if (e.key === "ArrowDown" || e.key === "s") {
        shootDirectionKeys.current.down = true;
      }
      if (e.key === "ArrowLeft" || e.key === "a") {
        shootDirectionKeys.current.left = true;
        setIsFacingRight(false);
      }
      if (e.key === "ArrowRight" || e.key === "d") {
        shootDirectionKeys.current.right = true;
        setIsFacingRight(true);
      }

      // Handle shooting (Contra-style multi-directional) - will be handled in update loop

      // Handle escape to exit
      if (e.key === "Escape") {
        handleExit();
      }

      // Debug left/right movement
      if (e.key === "ArrowLeft" || e.key === "a") {
        console.log("Shooter: LEFT pressed - should move left");
      } else if (e.key === "ArrowRight" || e.key === "d") {
        console.log("Shooter: RIGHT pressed - should move right");
      }
    };

    const handleKeyUp = (e) => {
      keysPressed.current[e.key] = false;

      // Handle jump release (Mario-style variable height)
      if (e.key === "ArrowUp" || e.key === "w") {
        jumpPressedRef.current = false;
        shootDirectionKeys.current.up = false;
      }
      if (e.key === "ArrowDown" || e.key === "s") {
        shootDirectionKeys.current.down = false;
      }
      if (e.key === "ArrowLeft" || e.key === "a") {
        shootDirectionKeys.current.left = false;
      }
      if (e.key === "ArrowRight" || e.key === "d") {
        shootDirectionKeys.current.right = false;
      }
    };

    // Add event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Ensure canvas is initialized before starting the game
    const ctx = initializeCanvas();
    if (ctx) {
      console.log("Canvas initialized successfully!");
      // Initialize enemies
      initializeEnemies();

      // Start the game
      startGame();

      // Set backup interval to ensure updates happen
      backupInterval = setInterval(() => {
        if (isGameActive && !gameOver) {
          // Force an update if we haven't seen one in a while
          updateGameState(1);
          renderGame();
          console.log("Backup game tick executed");
        }
      }, 100); // Check 10 times per second
    } else {
      console.error("Canvas initialization failed! Trying again in 100ms...");
      // Try to initialize again after a short delay
      setTimeout(() => {
        const retryCtx = initializeCanvas();
        if (retryCtx) {
          console.log("Canvas initialized successfully on retry!");
          startGame();
        } else {
          console.error("Canvas initialization failed on retry!");
        }
      }, 100);
    }

    // Cleanup function
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);

      // Cancel animation frame
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }

      // Clear backup interval
      if (backupInterval) {
        clearInterval(backupInterval);
      }
    };
  }, []);

  // For debugging
  useEffect(() => {
    console.log("Player position updated:", playerPosition.x, playerPosition.y);
  }, [playerPosition]);

  // Start the game
  const startGame = () => {
    console.log("Starting game...");
    setIsGameActive(true);
    setGameOver(false);

    // Initialize player position
    setPlayerPosition({ x: 100, y: 300 });
    setPlayerVelocity({ x: 0, y: 0 });

    // Reset bullets
    setPlayerBullets([]);
    setEnemyBullets([]);

    // Reset weapon
    setWeaponType("normal");

    // Reset camera
    setCameraOffset(0);

    // Initialize enemies
    initializeEnemies();

    // Show initial Hemingway quote
    setTimeout(() => {
      showHemingwayQuote(0);
    }, 1000);

    // Introduce Hemingway after a delay
    setTimeout(() => {
      setHemingwayActive(true);
      setHemingwayDialog(
        "Let's collect manuscripts and fight through the memories of my life.",
      );
      setShowHemingwayDialog(true);

      // Hide dialog after a few seconds
      setTimeout(() => {
        setShowHemingwayDialog(false);
      }, 4000);
    }, 3000);

    // Start the game loop
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }

    lastFrameTimeRef.current = performance.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    // Play background music for current level
    playSound(`${currentLevel}-music`);
  };

  // Update game state based on input and physics
  const updateGameState = (delta) => {
    if (!isGameActive || gameOver) return;

    // Store previous position for comparison
    const prevX = playerPosition.x;
    const prevY = playerPosition.y;

    // Update player position based on input
    updatePlayerPosition(delta);

    // Log movement for debugging
    if (prevX !== playerPosition.x || prevY !== playerPosition.y) {
      console.log(
        `Player moved: ${prevX.toFixed(2)},${prevY.toFixed(2)} → ${playerPosition.x.toFixed(2)},${playerPosition.y.toFixed(2)}`,
      );
    }

    // Update Hemingway companion position (follow player with a delay)
    if (hemingwayActive) {
      updateHemingwayPosition();
    }

    // Update shoot cooldown
    updateShootCooldown(delta);

    // Handle continuous shooting (while space is held)
    if (
      (keysPressed.current[" "] || keysPressed.current["Space"]) &&
      canShoot
    ) {
      handleShoot();
    }

    // Update bullets
    updateBullets(delta);

    // Update enemies
    updateEnemies(delta);

    // Update camera for side-scrolling
    updateCamera();

    // Check collisions with collectibles
    checkCollectibleCollisions();

    // Check bullet collisions
    checkBulletCollisions();

    // Check enemy collisions (jump on enemies)
    checkEnemyCollisions();

    // Check collisions with platforms
    checkCollisions();
  };

  // Update player position based on input and physics (Mario-style momentum)
  const updatePlayerPosition = (delta) => {
    let velocityX = playerVelocity.x;
    let velocityY = playerVelocity.y;

    // Mario-style acceleration/deceleration
    const leftPressed = keysPressed.current.ArrowLeft || keysPressed.current.a;
    const rightPressed =
      keysPressed.current.ArrowRight || keysPressed.current.d;

    if (leftPressed) {
      // Accelerate left
      velocityX -= PLAYER_ACCELERATION * delta * 60; // Scale by delta
      setIsFacingRight(false);
    } else if (rightPressed) {
      // Accelerate right
      velocityX += PLAYER_ACCELERATION * delta * 60;
      setIsFacingRight(true);
    } else {
      // Decelerate (friction)
      if (velocityX > 0) {
        velocityX = Math.max(0, velocityX - PLAYER_DECELERATION * delta * 60);
      } else if (velocityX < 0) {
        velocityX = Math.min(0, velocityX + PLAYER_DECELERATION * delta * 60);
      }
    }

    // Cap max speed
    velocityX = Math.max(
      -PLAYER_MAX_SPEED,
      Math.min(PLAYER_MAX_SPEED, velocityX),
    );

    // Variable jump height (Mario-style): reduce jump force if button released
    if (isJumping && velocityY < 0) {
      if (!jumpPressedRef.current) {
        // Button released early, reduce jump force for variable height
        velocityY *= 0.5; // Cut jump short (more responsive than 0.6)
        setIsJumping(false);
      } else {
        // Boost jump slightly while holding (max jump height)
        velocityY = Math.max(velocityY, JUMP_FORCE_MAX);
      }
    }

    // Apply gravity
    velocityY += GRAVITY * delta * 60;

    // Calculate new position
    let newX = playerPosition.x + velocityX * delta * 60;
    let newY = playerPosition.y + velocityY * delta * 60;

    // Check platform collisions
    const onGround = checkOnGround({ ...playerPosition, y: newY });
    if (onGround && velocityY > 0) {
      velocityY = 0;
      newY = onGround.y - 50; // Set player on top of platform (player height = 50)
      setIsJumping(false);
      jumpPressedRef.current = false;
    }

    // Check level boundaries
    if (newX < 0) {
      newX = 0;
      velocityX = 0;
    } else if (newX > levelWidth - 40) {
      // Player width = 40
      newX = levelWidth - 40;
      velocityX = 0;
    }

    // Check if player fell off the level
    if (newY > 500) {
      handlePlayerDeath();
      return;
    }

    // Check if player reached the end of the level
    if (newX > levelWidth - 250) {
      handleLevelComplete();
      return;
    }

    // Update player position and velocity
    setPlayerPosition({ x: newX, y: newY });
    setPlayerVelocity({ x: velocityX, y: velocityY });
  };

  // Update Hemingway companion position to follow player
  const updateHemingwayPosition = () => {
    // Hemingway follows the player with a delay, staying a bit behind
    const targetX = playerPosition.x - 70; // Stay 70px behind the player
    const targetY = playerPosition.y; // Same height as player

    // Move towards target position with direct assignment
    const dx = targetX - hemingwayPosition.x;
    const dy = targetY - hemingwayPosition.y;

    // Update position directly
    hemingwayPosition.x += dx * 0.05;
    hemingwayPosition.y = targetY;

    // Also update state for React to trigger re-renders
    setHemingwayPosition({
      x: hemingwayPosition.x,
      y: hemingwayPosition.y,
    });
  };

  // Update camera position for side-scrolling
  const updateCamera = () => {
    const screenWidth = 800; // Canvas width

    // If player gets too close to right edge, scroll right
    if (playerPosition.x - cameraOffset > screenWidth - SCROLL_MARGIN) {
      setCameraOffset(playerPosition.x - (screenWidth - SCROLL_MARGIN));
    }

    // If player gets too close to left edge, scroll left
    if (playerPosition.x - cameraOffset < SCROLL_MARGIN) {
      setCameraOffset(playerPosition.x - SCROLL_MARGIN);
    }

    // Ensure camera doesn't go outside level boundaries
    if (cameraOffset < 0) {
      setCameraOffset(0);
    } else if (cameraOffset > levelWidth - screenWidth) {
      setCameraOffset(levelWidth - screenWidth);
    }
  };

  // Check if player is on a platform
  const checkOnGround = (position) => {
    for (const platform of platforms) {
      if (
        position.x + 40 >= platform.x &&
        position.x <= platform.x + platform.width &&
        position.y + 50 >= platform.y &&
        position.y + 50 <= platform.y + 10 // Check if feet are just above platform
      ) {
        return platform;
      }
    }
    return null;
  };

  // Check for collisions with collectibles
  const checkCollectibleCollisions = () => {
    setCollectibles((prev) =>
      prev.map((item) => {
        // If already collected, skip
        if (item.collected) return item;

        // Check for collision with player
        if (
          playerPosition.x + 40 >= item.x &&
          playerPosition.x <= item.x + 30 &&
          playerPosition.y + 50 >= item.y &&
          playerPosition.y <= item.y + 30
        ) {
          // Handle collectible based on type
          handleCollectible(item.type);

          // Play sound effect
          playSound(`${item.type}-pickup`);

          // Mark as collected
          return { ...item, collected: true };
        }

        return item;
      }),
    );
  };

  // Handle collectible pickup
  const handleCollectible = (type) => {
    switch (type) {
      case "health":
        setPlayerHealth((prev) => Math.min(prev + 20, 100));
        setScore((prev) => prev + 50);
        break;
      case "weapon":
        // Upgrade to spread gun (Contra-style)
        setWeaponType("spread");
        setScore((prev) => prev + 100);
        // Show weapon pickup dialog
        setHemingwayDialog("Spread gun! Now we're armed like Contra!");
        setShowHemingwayDialog(true);
        setTimeout(() => {
          setShowHemingwayDialog(false);
        }, 3000);
        // Spread gun lasts for 30 seconds
        setTimeout(() => {
          setWeaponType("normal");
        }, 30000);
        break;
      case "manuscript":
        setScore((prev) => prev + 200);
        // Progress the story
        progressStory();
        break;
      default:
        break;
    }
  };

  // Initialize enemies for the level
  const initializeEnemies = () => {
    const levelEnemies = [
      // Basic enemies (can be jumped on or shot)
      {
        id: 1,
        x: 500,
        y: 300,
        width: 35,
        height: 35,
        health: 1,
        speed: 1,
        type: "basic",
        score: 50,
        canJump: true,
      },
      {
        id: 2,
        x: 800,
        y: 180,
        width: 35,
        height: 35,
        health: 1,
        speed: 1,
        type: "basic",
        score: 50,
        canJump: true,
      },
      {
        id: 3,
        x: 1200,
        y: 260,
        width: 35,
        height: 35,
        health: 1,
        speed: 1,
        type: "basic",
        score: 50,
        canJump: true,
      },
      // Shooting enemies (must be shot)
      {
        id: 4,
        x: 1600,
        y: 200,
        width: 35,
        height: 35,
        health: 2,
        speed: 0,
        type: "sniper",
        score: 75,
        canShoot: true,
        shootCooldown: 0,
      },
      {
        id: 5,
        x: 2000,
        y: 280,
        width: 35,
        height: 35,
        health: 2,
        speed: 0,
        type: "sniper",
        score: 75,
        canShoot: true,
        shootCooldown: 0,
      },
      // Moving enemies (walk back and forth)
      {
        id: 6,
        x: 2400,
        y: 180,
        width: 35,
        height: 35,
        health: 1,
        speed: 2,
        type: "walker",
        score: 60,
        direction: 1,
        patrolStart: 2400,
        patrolEnd: 2600,
      },
    ];
    setEnemies(levelEnemies);
  };

  // Update enemies
  const updateEnemies = (delta) => {
    setEnemies((prev) =>
      prev
        .map((enemy) => {
          if (!enemy) return enemy;

          let newEnemy = { ...enemy };

          // Update enemy movement
          if (enemy.type === "walker") {
            newEnemy.x += enemy.speed * enemy.direction * delta * 60;

            // Reverse direction at patrol boundaries
            if (newEnemy.x >= enemy.patrolEnd) {
              newEnemy.direction = -1;
            } else if (newEnemy.x <= enemy.patrolStart) {
              newEnemy.direction = 1;
            }
          } else if (enemy.type === "basic" && enemy.speed > 0) {
            // Basic enemies move left (toward player)
            newEnemy.x -= enemy.speed * delta * 60;
          }

          // Handle enemy shooting
          if (enemy.canShoot && enemy.x < playerPosition.x + 1000) {
            newEnemy.shootCooldown =
              (newEnemy.shootCooldown || 0) - delta * 1000;
            if (newEnemy.shootCooldown <= 0) {
              // Shoot at player
              const dx = playerPosition.x - enemy.x;
              const dy = playerPosition.y - enemy.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const bulletVelocityX = (dx / distance) * 6;
              const bulletVelocityY = (dy / distance) * 6;

              setEnemyBullets((prev) => [
                ...prev,
                {
                  id: Date.now() + Math.random(),
                  x: enemy.x + enemy.width / 2,
                  y: enemy.y + enemy.height / 2,
                  velocityX: bulletVelocityX,
                  velocityY: bulletVelocityY,
                  createdAt: Date.now(),
                },
              ]);

              newEnemy.shootCooldown = 2000; // 2 seconds between shots
            }
          }

          return newEnemy;
        })
        .filter(
          (enemy) =>
            enemy &&
            enemy.x > cameraOffset - 100 &&
            enemy.x < cameraOffset + 900,
        ),
    ); // Remove enemies off screen
  };

  // Progress the story based on collectibles
  const progressStory = () => {
    // Increment story progress
    setStoryProgress((prev) => {
      const newProgress = prev + 1;

      // Show different quotes based on story progress
      if (newProgress === 1) {
        setHemingwayDialog(
          "That's one of my manuscripts. These are the stories that defined me.",
        );
        setShowHemingwayDialog(true);
        setTimeout(() => {
          setShowHemingwayDialog(false);
        }, 3000);
        setTimeout(() => {
          showHemingwayQuote(1);
        }, 4000);
      } else if (newProgress === 3) {
        setHemingwayDialog(
          "You're helping me reclaim my life's work. We're halfway there.",
        );
        setShowHemingwayDialog(true);
        setTimeout(() => {
          setShowHemingwayDialog(false);
        }, 3000);
        setTimeout(() => {
          showHemingwayQuote(2);
        }, 4000);
      } else if (newProgress === 5) {
        setHemingwayDialog(
          "Just one more manuscript to find. Then I can rest.",
        );
        setShowHemingwayDialog(true);
        setTimeout(() => {
          setShowHemingwayDialog(false);
        }, 3000);
      }

      return newProgress;
    });
  };

  // Check for collisions between game objects
  const checkCollisions = () => {
    // Future collision logic will go here
  };

  // Handle player death
  const handlePlayerDeath = () => {
    console.log("Player died");
    setGameOver(true);
    setPlayerHealth(0);
    playSound("game-over");
  };

  // Victory screen handlers
  const handleVictoryContinue = () => {
    setShowVictory(false);
    if (onComplete) {
      onComplete({
        score: score,
        level: currentLevel,
        time: "5:30", // TODO: Calculate actual time
        achievements: ["First Victory", "Speed Runner", "Perfect Score"],
        rewards: {
          experience: 150,
          coins: 50,
          powers: ["Enhanced Movement", "Double Jump"],
        },
      });
    }
  };

  const handleVictoryReplay = () => {
    setShowVictory(false);
    startGame();
  };

  // Handle level completion
  const handleLevelComplete = () => {
    // Check if we've collected all manuscripts before allowing level completion
    const remainingManuscripts = collectibles.filter(
      (item) => item.type === "manuscript" && !item.collected,
    );

    if (remainingManuscripts.length === 0) {
      // If it's the final level, complete the game
      if (currentLevel === "africa") {
        handleGameVictory();
      } else {
        // Otherwise, go to the next level
        progressToNextLevel();
      }
    } else {
      // If manuscripts remain, show a hint
      setHemingwayDialog(
        `We need to find ${remainingManuscripts.length} more manuscripts before moving on.`,
      );
      setShowHemingwayDialog(true);
      setTimeout(() => {
        setShowHemingwayDialog(false);
      }, 3000);
    }
  };

  // Progress to the next level
  const progressToNextLevel = () => {
    // Determine the next level
    let nextLevel = "spain";
    if (currentLevel === "spain") {
      nextLevel = "africa";
    }

    // Show level complete message
    setHemingwayDialog(
      `We've made it through ${levelDescriptions[currentLevel]}. Now on to ${levelDescriptions[nextLevel]}.`,
    );
    setShowHemingwayDialog(true);

    // Update level after a delay
    setTimeout(() => {
      setShowHemingwayDialog(false);
      setCurrentLevel(nextLevel);

      // Reset player position and scroll
      setPlayerPosition({ x: 100, y: 300 });
      setCameraOffset(0);

      // Reset collectibles for the new level (would typically load new ones)
      setCollectibles((prev) =>
        prev.map((item) => ({ ...item, collected: false })),
      );

      // Show quote for the new level
      showHemingwayQuote();

      // Play music for new level
      playSound(`${nextLevel}-music`);
    }, 4000);
  };

  // Handle game victory
  const handleGameVictory = () => {
    console.log("Game Victory!");
    setShowVictory(true);
    setIsGameActive(false);
    playSound("victory");

    // Stop the game loop
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  };

  // Handle player jumping (Mario-style variable height)
  const jump = () => {
    const onGround = checkOnGround(playerPosition);
    if (!isJumping && onGround) {
      setIsJumping(true);

      // Apply jump force directly
      const currentVelocity = playerVelocity.y;
      setPlayerVelocity((prev) => ({ ...prev, y: JUMP_FORCE }));

      playSound("jump");
    }
  };

  // Handle shooting (Contra-style multi-directional)
  const handleShoot = () => {
    if (!canShoot || !isGameActive || gameOver) return;

    const cooldownTime =
      weaponType === "spread" ? SPREAD_SHOOT_COOLDOWN : SHOOT_COOLDOWN_TIME;

    setCanShoot(false);
    setShootCooldown(cooldownTime);

    // Determine shoot direction from current keys pressed
    let dirX = 0;
    let dirY = 0;

    if (shootDirectionKeys.current.left) dirX = -1;
    if (shootDirectionKeys.current.right) dirX = 1;
    if (shootDirectionKeys.current.up) dirY = -1;
    if (shootDirectionKeys.current.down) dirY = 1;

    // If no vertical direction, default to horizontal facing direction
    if (dirX === 0 && dirY === 0) {
      dirX = isFacingRight ? 1 : -1;
    } else {
      // Normalize diagonal directions
      const length = Math.sqrt(dirX * dirX + dirY * dirY);
      dirX = dirX / length;
      dirY = dirY / length;
    }

    // Create bullet(s)
    const bullets = [];

    if (weaponType === "spread") {
      // Spread gun: shoot in 5 directions (up, down, left, right, forward)
      const directions = [
        { x: dirX, y: dirY }, // Forward
        { x: dirX, y: dirY - 0.5 }, // Up angle
        { x: dirX, y: dirY + 0.5 }, // Down angle
        { x: dirX - 0.3, y: dirY }, // Left angle
        { x: dirX + 0.3, y: dirY }, // Right angle
      ];

      directions.forEach((dir, index) => {
        const length = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
        bullets.push({
          id: Date.now() + index,
          x: playerPosition.x + 20, // Center of player
          y: playerPosition.y + 25,
          velocityX: (dir.x / length) * BULLET_SPEED,
          velocityY: (dir.y / length) * BULLET_SPEED,
          createdAt: Date.now(),
          type: "spread",
        });
      });
    } else {
      // Normal gun: single bullet
      bullets.push({
        id: Date.now(),
        x: playerPosition.x + 20,
        y: playerPosition.y + 25,
        velocityX: dirX * BULLET_SPEED,
        velocityY: dirY * BULLET_SPEED,
        createdAt: Date.now(),
        type: "normal",
      });
    }

    setPlayerBullets((prev) => [...prev, ...bullets]);
    playSound("shoot");
  };

  // Update bullets
  const updateBullets = (delta) => {
    const now = Date.now();

    // Update player bullets
    setPlayerBullets((prev) =>
      prev
        .filter((bullet) => {
          // Remove old bullets
          if (now - bullet.createdAt > BULLET_LIFETIME) return false;

          // Remove bullets that go off screen
          if (
            bullet.x < cameraOffset - 100 ||
            bullet.x > cameraOffset + 900 ||
            bullet.y < -50 ||
            bullet.y > 450
          )
            return false;

          // Remove bullets that hit enemies (handled in collision check)
          return true;
        })
        .map((bullet) => ({
          ...bullet,
          x: bullet.x + bullet.velocityX * delta * 60,
          y: bullet.y + bullet.velocityY * delta * 60,
        })),
    );

    // Update enemy bullets
    setEnemyBullets((prev) =>
      prev
        .filter((bullet) => {
          if (now - bullet.createdAt > BULLET_LIFETIME) return false;
          if (
            bullet.x < cameraOffset - 100 ||
            bullet.x > cameraOffset + 900 ||
            bullet.y < -50 ||
            bullet.y > 450
          )
            return false;
          return true;
        })
        .map((bullet) => ({
          ...bullet,
          x: bullet.x + bullet.velocityX * delta * 60,
          y: bullet.y + bullet.velocityY * delta * 60,
        })),
    );
  };

  // Update shoot cooldown (called in update loop)
  const updateShootCooldown = (delta) => {
    if (shootCooldown > 0) {
      const newCooldown = shootCooldown - delta * 1000;
      if (newCooldown <= 0) {
        setCanShoot(true);
        setShootCooldown(0);
      } else {
        setShootCooldown(newCooldown);
      }
    }
  };

  // Check bullet-enemy collisions
  const checkBulletCollisions = () => {
    setPlayerBullets((prev) =>
      prev.filter((bullet) => {
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i];
          if (
            enemy &&
            bullet.x >= enemy.x &&
            bullet.x <= enemy.x + enemy.width &&
            bullet.y >= enemy.y &&
            bullet.y <= enemy.y + enemy.height
          ) {
            // Hit enemy
            handleEnemyHit(enemy.id, bullet.type === "spread" ? 2 : 1);
            return false; // Remove bullet
          }
        }
        return true; // Keep bullet
      }),
    );

    // Check enemy bullets hitting player
    setEnemyBullets((prev) =>
      prev.filter((bullet) => {
        if (
          bullet.x >= playerPosition.x &&
          bullet.x <= playerPosition.x + 40 &&
          bullet.y >= playerPosition.y &&
          bullet.y <= playerPosition.y + 50
        ) {
          // Hit player
          setPlayerHealth((prev) => Math.max(0, prev - 10));
          playSound("player-hit");
          return false; // Remove bullet
        }
        return true;
      }),
    );
  };

  // Check player-enemy collisions (for jumping on enemies - Mario-style)
  const checkEnemyCollisions = () => {
    enemies.forEach((enemy) => {
      if (!enemy) return;

      // Check if player is above enemy (jumping on top)
      if (
        playerPosition.x + 40 >= enemy.x &&
        playerPosition.x <= enemy.x + enemy.width &&
        playerPosition.y + 50 >= enemy.y &&
        playerPosition.y <= enemy.y + 15 && // Only if landing on top
        playerVelocity.y > 0 // Falling down
      ) {
        // Jump on enemy (Mario-style)
        if (enemy.canJump) {
          // Bounce off enemy (Mario-style bounce)
          setPlayerVelocity((prev) => ({ ...prev, y: -12 })); // Stronger bounce for better feel
          // Defeat enemy
          handleEnemyHit(enemy.id, 999); // Instant kill
          setScore((prev) => prev + (enemy.score || 50));
          playSound("jump-on-enemy");
        }
      } else if (
        // Enemy touching player (damage player)
        playerPosition.x + 40 >= enemy.x &&
        playerPosition.x <= enemy.x + enemy.width &&
        playerPosition.y + 50 >= enemy.y &&
        playerPosition.y <= enemy.y + enemy.height
      ) {
        // Take damage
        setPlayerHealth((prev) => Math.max(0, prev - 1));
        // Knockback
        if (playerPosition.x < enemy.x) {
          setPlayerVelocity((prev) => ({ ...prev, x: -3 }));
        } else {
          setPlayerVelocity((prev) => ({ ...prev, x: 3 }));
        }
      }
    });
  };

  // Handle enemy hit
  const handleEnemyHit = (enemyId, damage) => {
    setEnemies((prev) =>
      prev
        .map((enemy) => {
          if (enemy.id === enemyId) {
            const newHealth = enemy.health - damage;
            if (newHealth <= 0) {
              // Enemy defeated
              setScore((prevScore) => prevScore + enemy.score || 50);
              playSound("enemy-defeat");
              return null; // Remove enemy
            }
            return { ...enemy, health: newHealth };
          }
          return enemy;
        })
        .filter((enemy) => enemy !== null),
    );
  };

  // Render game to canvas
  const renderGame = () => {
    try {
      const ctx = initializeCanvas();
      if (!ctx) {
        console.error("No canvas context available for rendering");
        return;
      }

      // Clear canvas
      ctx.clearRect(0, 0, 800, 400);

      // Draw background based on current level
      drawBackground(ctx);

      // Apply camera offset to all world elements
      ctx.save();
      console.log("Camera offset:", cameraOffset);
      ctx.translate(-Math.floor(cameraOffset), 0); // Floor for pixel-perfect rendering

      // Debug grid (for development)
      drawDebugGrid(ctx);

      // Draw platforms
      drawPlatforms(ctx);

      // Draw collectibles
      drawCollectibles(ctx);

      // Draw enemies
      drawEnemies(ctx);

      // Draw bullets
      drawBullets(ctx);

      // Draw Hemingway companion if active
      if (hemingwayActive) {
        drawHemingway(ctx);
      }

      // Draw player
      drawPlayer(ctx);

      // Restore normal translation
      ctx.restore();

      // Draw HUD (not affected by camera)
      drawHUD(ctx);

      // Draw dialog if active
      if (showHemingwayDialog) {
        drawDialog(ctx, hemingwayDialog);
      }

      // Draw quote if active
      if (showQuote) {
        drawQuote(ctx);
      }

      // Draw debug info
      drawDebugInfo(ctx);
    } catch (error) {
      console.error("Error rendering game:", error);
    }
  };

  // Draw background based on current level
  const drawBackground = (ctx) => {
    switch (currentLevel) {
      case "paris":
        ctx.fillStyle = "#6CA0DC"; // Paris blue sky
        break;
      case "spain":
        ctx.fillStyle = "#E1BC92"; // Spain sepia tone
        break;
      case "africa":
        ctx.fillStyle = "#FFD700"; // Africa golden savanna
        break;
      default:
        ctx.fillStyle = "#87CEEB"; // Default sky blue
    }
    ctx.fillRect(0, 0, 800, 400);

    // Draw far background elements based on level
    // (clouds, mountains, etc. - will be added later)
  };

  // Draw platforms
  const drawPlatforms = (ctx) => {
    platforms.forEach((platform) => {
      switch (platform.type) {
        case "end-platform":
          ctx.fillStyle = "#FFD700"; // Gold
          break;
        case "platform":
          ctx.fillStyle = "#8B4513"; // Brown
          break;
        case "ground":
        default:
          ctx.fillStyle = "#3A5F0B"; // Grass green
      }
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });
  };

  // Draw collectibles
  const drawCollectibles = (ctx) => {
    collectibles.forEach((item) => {
      if (item.collected) return; // Skip if already collected

      switch (item.type) {
        case "health":
          ctx.fillStyle = "#FF0000"; // Red for health
          break;
        case "weapon":
          ctx.fillStyle = "#FFA500"; // Orange for spread gun
          break;
        case "manuscript":
          ctx.fillStyle = "#FFFFFF"; // White for manuscript
          break;
        default:
          ctx.fillStyle = "#FFFF00"; // Yellow for unknown items
      }

      ctx.fillRect(item.x, item.y, 30, 30); // Simple rectangle for now
    });
  };

  // Draw enemies
  const drawEnemies = (ctx) => {
    enemies.forEach((enemy) => {
      if (!enemy) return;

      switch (enemy.type) {
        case "basic":
          ctx.fillStyle = "#FF4444"; // Red for basic enemies
          break;
        case "sniper":
          ctx.fillStyle = "#FF8800"; // Orange for snipers
          break;
        case "walker":
          ctx.fillStyle = "#AA44FF"; // Purple for walkers
          break;
        default:
          ctx.fillStyle = "#FF0000";
      }

      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

      // Draw health indicator for enemies with more than 1 health
      if (enemy.health > 1) {
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(enemy.x, enemy.y - 5, (enemy.health / 2) * enemy.width, 3);
      }
    });
  };

  // Draw bullets
  const drawBullets = (ctx) => {
    // Draw player bullets (yellow/orange)
    playerBullets.forEach((bullet) => {
      ctx.fillStyle = bullet.type === "spread" ? "#FFAA00" : "#FFFF00";
      ctx.fillRect(bullet.x - 2, bullet.y - 2, 4, 4);
    });

    // Draw enemy bullets (red)
    enemyBullets.forEach((bullet) => {
      ctx.fillStyle = "#FF0000";
      ctx.fillRect(bullet.x - 2, bullet.y - 2, 4, 4);
    });
  };

  // Draw player character
  const drawPlayer = (ctx) => {
    try {
      console.log(
        `Drawing player at: x=${Math.floor(playerPosition.x)}, y=${Math.floor(playerPosition.y)}, facing: ${isFacingRight ? "right" : "left"}`,
      );

      // Draw a more visible rectangle regardless of image loading
      ctx.strokeStyle = "#FF0000"; // Red border
      ctx.lineWidth = 2;
      ctx.strokeRect(playerPosition.x, playerPosition.y, 40, 50);

      if (playerImageRef.current && playerImageRef.current.complete) {
        // Draw player image
        if (!isFacingRight) {
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(
            playerImageRef.current,
            -playerPosition.x - 40,
            playerPosition.y,
            40,
            50,
          );
          ctx.restore();
        } else {
          ctx.drawImage(
            playerImageRef.current,
            playerPosition.x,
            playerPosition.y,
            40,
            50,
          );
        }
        console.log("Player image drawn successfully");
      } else {
        // Fallback to rectangle if image not loaded
        console.log("Using fallback rectangle for player (image not loaded)");
        ctx.fillStyle = "#FF0000"; // Red
        ctx.fillRect(playerPosition.x, playerPosition.y, 40, 50);
      }

      // Draw a debug marker at player center
      ctx.fillStyle = "#FFFF00"; // Yellow dot
      ctx.beginPath();
      ctx.arc(playerPosition.x + 20, playerPosition.y + 25, 3, 0, Math.PI * 2);
      ctx.fill();
    } catch (error) {
      console.error("Error drawing player:", error);
      // Fallback drawing
      ctx.fillStyle = "#FF0000"; // Red
      ctx.fillRect(playerPosition.x, playerPosition.y, 40, 50);
    }
  };

  // Draw Hemingway companion
  const drawHemingway = (ctx) => {
    if (hemingwayImageRef.current && hemingwayImageRef.current.complete) {
      // Draw Hemingway image
      ctx.drawImage(
        hemingwayImageRef.current,
        hemingwayPosition.x,
        hemingwayPosition.y,
        40,
        50,
      );
    } else {
      // Fallback to rectangle if image not loaded
      ctx.fillStyle = "#0000FF"; // Blue
      ctx.fillRect(hemingwayPosition.x, hemingwayPosition.y, 40, 50);
    }
  };

  // Draw HUD
  const drawHUD = (ctx) => {
    // Draw score
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px Courier New";
    ctx.fillText(`Score: ${score}`, 20, 30);

    // Draw health bar
    ctx.fillStyle = "#333333";
    ctx.fillRect(20, 40, 150, 15); // Background

    // Health fill
    const healthWidth = (playerHealth / 100) * 150;
    ctx.fillStyle =
      playerHealth > 50 ? "#00FF00" : playerHealth > 25 ? "#FFFF00" : "#FF0000";
    ctx.fillRect(20, 40, healthWidth, 15);

    // Draw level name
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "14px Courier New";
    ctx.fillText(levelDescriptions[currentLevel], 20, 70);

    // Draw manuscripts collected
    const collectedCount = collectibles.filter(
      (item) => item.type === "manuscript" && item.collected,
    ).length;
    const totalCount = collectibles.filter(
      (item) => item.type === "manuscript",
    ).length;
    ctx.fillText(`Manuscripts: ${collectedCount}/${totalCount}`, 20, 90);
  };

  // Draw dialog bubble
  const drawDialog = (ctx, text) => {
    const x = 400; // Center of screen
    const y = 100; // Near top of screen

    // Draw bubble
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;

    // Round rectangle
    ctx.beginPath();
    ctx.roundRect(x - 150, y - 30, 300, 60, 10);
    ctx.fill();
    ctx.stroke();

    // Draw text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "12px Courier New";
    ctx.textAlign = "center";
    ctx.fillText(text, x, y);
    ctx.fillText("- Hemingway", x + 80, y + 20);
    ctx.textAlign = "left"; // Reset text alignment
  };

  // Draw quote
  const drawQuote = (ctx) => {
    const x = 400; // Center of screen
    const y = 200; // Middle of screen

    // Draw quote background
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.strokeStyle = "#999999";
    ctx.lineWidth = 2;

    // Round rectangle
    ctx.beginPath();
    ctx.roundRect(x - 200, y - 40, 400, 80, 15);
    ctx.fill();
    ctx.stroke();

    // Draw quote text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "14px Courier New";
    ctx.textAlign = "center";

    // Split text into multiple lines if needed
    const words = currentQuote.text.split(" ");
    let line = "";
    let lines = [];
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      if (ctx.measureText(testLine).width > 380) {
        lines.push(line);
        line = words[i] + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    // Draw each line
    lines.forEach((line, index) => {
      ctx.fillText(line, x, y - 15 + index * 20);
    });

    // Draw attribution
    ctx.font = "italic 12px Courier New";
    ctx.fillText(currentQuote.author, x, y + 30);

    ctx.textAlign = "left"; // Reset text alignment
  };

  // Draw debug grid (helps visualize movement)
  const drawDebugGrid = (ctx) => {
    // Only in development mode
    if (process.env.NODE_ENV !== "development") return;

    const gridSize = 100;
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x < levelWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 400);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < 400; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(levelWidth, y);
      ctx.stroke();
    }
  };

  // Draw debug info
  const drawDebugInfo = (ctx) => {
    // Only in development mode
    if (process.env.NODE_ENV !== "development") return;

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(600, 10, 190, 100);

    ctx.fillStyle = "#00ff00";
    ctx.font = "12px monospace";
    ctx.fillText(
      `Player: X:${Math.floor(playerPosition.x)} Y:${Math.floor(playerPosition.y)}`,
      610,
      30,
    );
    ctx.fillText(
      `Velocity: X:${playerVelocity.x.toFixed(2)} Y:${playerVelocity.y.toFixed(2)}`,
      610,
      50,
    );
    ctx.fillText(`Facing: ${isFacingRight ? "Right" : "Left"}`, 610, 70);
    ctx.fillText(`Jumping: ${isJumping ? "Yes" : "No"}`, 610, 90);
  };

  // Handle exit
  const handleExit = () => {
    if (onExit) onExit();
  };

  // Play sound effect with robust error handling
  const playSound = (soundName) => {
    // Skip sounds if we're having issues with the sound system
    try {
      // Try to find a working path but don't throw errors if it fails
      const audio = new Audio();

      // Set up error handling before setting src to prevent unhandled rejections
      audio.onerror = () => {
        // Silently fail - we don't want sound issues to break the game
        console.log(
          `Could not load sound: ${soundName} - continuing without sound`,
        );
      };

      // Try with the most likely path
      audio.src = `/assets/sounds/hemingway/${soundName}.mp3`;

      // Set volume and play with catch for browser autoplay restrictions
      audio.volume = 0.3; // Lower volume to be less intrusive

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Silently fail on autoplay restrictions or other issues
          console.log(`Couldn't play sound ${soundName}: ${error.message}`);
        });
      }
    } catch (error) {
      // Completely silent catch - sounds are non-essential
      console.log(`Sound system error with ${soundName}: ${error.message}`);
    }
  };

  // Show a Hemingway quote
  const showHemingwayQuote = (index = -1) => {
    const quoteIndex =
      index >= 0 ? index : Math.floor(Math.random() * hemingwayQuotes.length);
    setCurrentQuote(hemingwayQuotes[quoteIndex]);
    setShowQuote(true);

    // Hide quote after a few seconds
    setTimeout(() => {
      setShowQuote(false);
    }, 5000);
  };

  // Component render
  return (
    <div className="level4-shooter">
      <div className="shooter-hud">
        <div className="score-display">SCORE: {score}</div>
        <div className="health-display">HEALTH: {playerHealth}</div>
      </div>

      <div className={`game-canvas-container ${currentLevel}-background`}>
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="game-canvas"
        />
      </div>

      {showVictory && (
        <VictoryScreen
          gameType="shooter"
          score={score}
          time="5:30"
          achievements={["First Victory", "Speed Runner", "Perfect Score"]}
          rewards={{
            experience: 150,
            coins: 50,
            powers: ["Enhanced Movement", "Double Jump"],
          }}
          onContinue={handleVictoryContinue}
          onReplay={handleVictoryReplay}
          creator="Aurthurneticus Interneticus"
        />
      )}

      {gameOver && !showVictory && (
        <div className="game-over-overlay">
          <div className="game-over-content">
            <h2>{playerHealth <= 0 ? "Game Over" : "Victory!"}</h2>
            <p>Your score: {score}</p>
            {playerHealth <= 0 ? (
              <button onClick={startGame}>Try Again</button>
            ) : (
              <p>
                "Throughout his life, Hemingway sought adventure and meaning in
                his travels, capturing the essence of the human experience
                through his writing."
              </p>
            )}
            <button onClick={handleExit}>Exit Game</button>
          </div>
        </div>
      )}

      <div className="controls-info">
        <h3>🎮 Shooter Game Controls</h3>
        <p>
          <strong>Movement:</strong> Arrow Keys or WASD (Mario-style momentum)
        </p>
        <p>
          <strong>Jump:</strong> Up Arrow or W (hold for higher jump)
        </p>
        <p>
          <strong>Shoot:</strong> Space Bar (Contra-style 8-directional)
        </p>
        <p>
          <strong>Aim:</strong> Hold Arrow Keys while shooting
        </p>
        <p>
          <strong>Exit:</strong> ESC
        </p>
      </div>
    </div>
  );
};

Level4Shooter.propTypes = {
  onComplete: PropTypes.func,
  onExit: PropTypes.func,
  character: PropTypes.object,
};

export default Level4Shooter;
