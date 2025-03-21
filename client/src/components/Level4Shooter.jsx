import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { playSound, preloadSound } from '../utils/soundEffects';
import './Level4Shooter.css';

const Level4Shooter = ({ onComplete, onExit }) => {
  // Game state
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [victory, setVictory] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  
  // Progression system
  const [playerXP, setPlayerXP] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [levelThresholds] = useState([0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [currentQuote, setCurrentQuote] = useState('');
  const [showQuote, setShowQuote] = useState(false);
  
  // Player state
  const [playerPosition, setPlayerPosition] = useState({ x: 100, y: 300 });
  const [playerHealth, setPlayerHealth] = useState(100);
  const [playerDirection, setPlayerDirection] = useState('right');
  const [isShooting, setIsShooting] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isCrouching, setIsCrouching] = useState(false);
  const [playerPowerups, setPlayerPowerups] = useState({
    rapidFire: { active: false, timeLeft: 0 },
    shield: { active: false, timeLeft: 0 },
    speedBoost: { active: false, timeLeft: 0 }
  });
  
  // Hemingway (companion) state
  const [hemingwayPosition, setHemingwayPosition] = useState({ x: 150, y: 300 });
  const [hemingwayHealth, setHemingwayHealth] = useState(100);
  const [hemingwayDirection, setHemingwayDirection] = useState('right');
  const [hemingwayIsShooting, setHemingwayIsShooting] = useState(false);
  const [hemingwayMode, setHemingwayMode] = useState('follow'); // follow, defend, attack
  
  // Game objects
  const [bullets, setBullets] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [items, setItems] = useState([]);
  const [bossActive, setBossActive] = useState(false);
  const [bossHealth, setBossHealth] = useState(500);
  const [bossPosition, setBossPosition] = useState({ x: 1800, y: 250 });
  const [bossType, setBossType] = useState(null);
  
  // Refs for animation frame and game loop
  const gameLoopRef = useRef(null);
  const canvasRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const keysPressed = useRef({});
  
  // Game settings
  const GRAVITY = 0.5;
  const JUMP_FORCE = -12;
  const PLAYER_SPEED = 5;
  const SCROLL_SPEED = 2;
  const ENEMY_SPAWN_RATE = 2000; // ms
  const BULLET_SPEED = 10;
  const HEMINGWAY_AI_DELAY = 500; // ms
  const LEVEL_WIDTH = 2500; // Total level width
  
  // Sound mapping - maps game events to sound IDs
  const SOUND_MAPPING = {
    // Player actions
    'shoot': 'hemingway-shoot',
    'special-shoot': 'hemingway-special-shoot',
    'jump': 'hemingway-jump',
    'playerHit': 'hemingway-player-hit',
    'hemingwayHit': 'hemingway-companion-hit',
    
    // Enemy sounds
    'hit': 'hemingway-enemy-hit',
    'criticalHit': 'hemingway-critical-hit',
    'bossHit': 'hemingway-boss-hit',
    'boss-criticalHit': 'hemingway-boss-critical',
    
    // Item pickups
    'healthPickup': 'hemingway-health-pickup',
    'weaponPickup': 'hemingway-weapon-pickup',
    'ammoPickup': 'hemingway-ammo-pickup',
    'manuscriptPickup': 'hemingway-manuscript-pickup',
    'powerupPickup': 'hemingway-powerup-pickup',
    
    // Game state changes
    'levelUp': 'hemingway-level-up',
    'gameOver': 'hemingway-game-over',
    'victory': 'hemingway-victory',
    'bossDefeated': 'hemingway-boss-defeated'
  };
  
  // Hemingway quotes collection
  const hemingwayQuotes = [
    "Courage is grace under pressure.",
    "There is nothing to writing. All you do is sit down at a typewriter and bleed.",
    "The world breaks everyone, and afterward, some are strong at the broken places.",
    "Never mistake motion for action.",
    "The first draft of anything is shit.",
    "All you have to do is write one true sentence.",
    "There is no hunting like the hunting of man, and those who have hunted armed men long enough and liked it, never care for anything else thereafter.",
    "Every man's life ends the same way. It is only the details of how he lived and how he died that distinguish one man from another.",
    "Always do sober what you said you'd do drunk. That will teach you to keep your mouth shut.",
    "Happiness in intelligent people is the rarest thing I know.",
    "All things truly wicked start from innocence.",
    "The best way to find out if you can trust somebody is to trust them.",
    "I drink to make other people more interesting.",
    "Write hard and clear about what hurts.",
    "The most painful thing is losing yourself in the process of loving someone too much, and forgetting that you are special too."
  ];
  
  // Quotes for specific gameplay moments
  const contextQuotes = {
    levelUp: [
      "All good books are alike in that they are truer than if they had really happened.",
      "Write drunk; edit sober.",
      "The shortest answer is doing the thing."
    ],
    criticalHit: [
      "Never think that war, no matter how necessary, nor how justified, is not a crime.",
      "There is nothing else than now. There is neither yesterday, certainly, nor is there any tomorrow.",
      "No weapon has ever settled a moral problem."
    ],
    lowHealth: [
      "A man can be destroyed but not defeated.",
      "If people bring so much courage to this world the world has to kill them to break them.",
      "The world breaks everyone and afterward many are strong at the broken places."
    ],
    victory: [
      "But man is not made for defeat. A man can be destroyed but not defeated.",
      "Every day is a new day. It is better to be lucky. But I would rather be exact.",
      "There is nothing noble in being superior to your fellow man; true nobility is being superior to your former self."
    ]
  };
  
  // Initialize game
  useEffect(() => {
    // Preload all game sounds
    preloadSound('hemingway-shoot', '/assets/sounds/hemingway/shoot.mp3');
    preloadSound('hemingway-special-shoot', '/assets/sounds/hemingway/special-shoot.mp3');
    preloadSound('hemingway-jump', '/assets/sounds/hemingway/jump.mp3');
    preloadSound('hemingway-player-hit', '/assets/sounds/hemingway/player-hit.mp3');
    preloadSound('hemingway-companion-hit', '/assets/sounds/hemingway/companion-hit.mp3');
    
    preloadSound('hemingway-enemy-hit', '/assets/sounds/hemingway/enemy-hit.mp3');
    preloadSound('hemingway-critical-hit', '/assets/sounds/hemingway/critical-hit.mp3');
    preloadSound('hemingway-boss-hit', '/assets/sounds/hemingway/boss-hit.mp3');
    preloadSound('hemingway-boss-critical', '/assets/sounds/hemingway/boss-critical.mp3');
    
    preloadSound('hemingway-health-pickup', '/assets/sounds/hemingway/health-pickup.mp3');
    preloadSound('hemingway-weapon-pickup', '/assets/sounds/hemingway/weapon-pickup.mp3');
    preloadSound('hemingway-ammo-pickup', '/assets/sounds/hemingway/ammo-pickup.mp3');
    preloadSound('hemingway-manuscript-pickup', '/assets/sounds/hemingway/manuscript-pickup.mp3');
    preloadSound('hemingway-powerup-pickup', '/assets/sounds/hemingway/powerup-pickup.mp3');
    
    preloadSound('hemingway-level-up', '/assets/sounds/hemingway/level-up.mp3');
    preloadSound('hemingway-game-over', '/assets/sounds/hemingway/game-over.mp3');
    preloadSound('hemingway-victory', '/assets/sounds/hemingway/victory.mp3');
    preloadSound('hemingway-boss-defeated', '/assets/sounds/hemingway/boss-defeated.mp3');
    
    // Create platforms based on current level
    initializeLevelDesign();
    
    // Create initial items
    const initialItems = generateItems();
    setItems(initialItems);
    
    // Set up initial enemy spawn
    spawnEnemies();
    
    // Set up event listeners for keyboard
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Start the game
    startGame();
    
    return () => {
      // Clean up event listeners and game loop
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(gameLoopRef.current);
    };
  }, [currentLevel]); // Re-initialize when level changes
  
  // Initialize level design based on current level
  const initializeLevelDesign = () => {
    let levelPlatforms = [];
    let levelBackground = '';
    
    switch(currentLevel) {
      case 1: // Intro level - Paris cafes
        levelPlatforms = [
          { x: 0, y: 350, width: LEVEL_WIDTH, height: 50, type: 'ground' },
          { x: 300, y: 250, width: 200, height: 20, type: 'platform' },
          { x: 600, y: 200, width: 150, height: 20, type: 'platform' },
          { x: 900, y: 280, width: 100, height: 20, type: 'platform' },
          { x: 1200, y: 220, width: 250, height: 20, type: 'platform' },
          { x: 1500, y: 300, width: 100, height: 20, type: 'platform' },
          { x: 1700, y: 250, width: 120, height: 20, type: 'platform' },
          { x: 2000, y: 200, width: 200, height: 20, type: 'platform' },
          { x: 2300, y: 300, width: 200, height: 50, type: 'end-platform' }
        ];
        levelBackground = 'paris-background';
        break;
        
      case 2: // Spanish Civil War
        levelPlatforms = [
          { x: 0, y: 350, width: LEVEL_WIDTH, height: 50, type: 'ground' },
          { x: 200, y: 280, width: 150, height: 20, type: 'platform' },
          { x: 400, y: 230, width: 120, height: 20, type: 'platform' },
          { x: 600, y: 180, width: 100, height: 20, type: 'platform' },
          { x: 850, y: 230, width: 100, height: 20, type: 'platform' },
          { x: 1000, y: 250, width: 80, height: 20, type: 'platform' },
          // Trench section
          { x: 1200, y: 320, width: 300, height: 30, type: 'trench' },
          { x: 1600, y: 270, width: 100, height: 20, type: 'platform' },
          { x: 1800, y: 220, width: 120, height: 20, type: 'platform' },
          { x: 2100, y: 180, width: 150, height: 20, type: 'platform' },
          { x: 2300, y: 300, width: 200, height: 50, type: 'end-platform' }
        ];
        levelBackground = 'spain-background';
        break;
        
      case 3: // African Safari
        levelPlatforms = [
          { x: 0, y: 350, width: LEVEL_WIDTH, height: 50, type: 'ground' },
          // Uneven terrain
          { x: 300, y: 320, width: 200, height: 30, type: 'hill' },
          { x: 600, y: 300, width: 250, height: 50, type: 'hill' },
          // Tree platforms
          { x: 400, y: 230, width: 80, height: 15, type: 'tree-platform' },
          { x: 550, y: 180, width: 60, height: 15, type: 'tree-platform' },
          { x: 750, y: 200, width: 70, height: 15, type: 'tree-platform' },
          { x: 900, y: 250, width: 100, height: 20, type: 'platform' },
          { x: 1100, y: 220, width: 120, height: 20, type: 'platform' },
          // River section with stepping stones
          { x: 1300, y: 330, width: 400, height: 20, type: 'water' },
          { x: 1350, y: 310, width: 40, height: 20, type: 'stone' },
          { x: 1450, y: 310, width: 40, height: 20, type: 'stone' },
          { x: 1550, y: 310, width: 40, height: 20, type: 'stone' },
          { x: 1650, y: 310, width: 40, height: 20, type: 'stone' },
          
          { x: 1800, y: 280, width: 150, height: 20, type: 'platform' },
          { x: 2000, y: 230, width: 120, height: 20, type: 'platform' },
          { x: 2200, y: 180, width: 100, height: 20, type: 'platform' },
          { x: 2300, y: 300, width: 200, height: 50, type: 'boss-platform' }
        ];
        levelBackground = 'africa-background';
        break;
    }
    
    setPlatforms(levelPlatforms);
    
    // Update boss platform position
    if (currentLevel === 3) {
      setBossPosition({ x: 2350, y: 250 });
    }
    
    // Set level background class
    document.querySelector('.game-canvas-container').className = 
      `game-canvas-container ${levelBackground}`;
  };
  
  // Generate items based on level
  const generateItems = () => {
    const levelItems = [];
    
    // Basic health items
    levelItems.push(
      { x: 350, y: 220, type: 'health', collected: false },
      { x: 1250, y: 190, type: 'health', collected: false }
    );
    
    // Level specific items
    switch(currentLevel) {
      case 1:
        levelItems.push(
          { x: 700, y: 170, type: 'weapon', collected: false, variant: 'typewriter' },
          { x: 1600, y: 270, type: 'manuscript', collected: false }
        );
        break;
      case 2:
        levelItems.push(
          { x: 500, y: 200, type: 'weapon', collected: false, variant: 'rifle' },
          { x: 1300, y: 290, type: 'ammo', collected: false },
          { x: 1900, y: 190, type: 'health', collected: false }
        );
        break;
      case 3:
        levelItems.push(
          { x: 800, y: 170, type: 'weapon', collected: false, variant: 'hunting-rifle' },
          { x: 1500, y: 280, type: 'powerup', collected: false, variant: 'speed' },
          { x: 2100, y: 150, type: 'health', collected: false },
          { x: 2250, y: 150, type: 'ammo', collected: false }
        );
        break;
    }
    
    return levelItems;
  };
  
  // Start the game
  const startGame = () => {
    setIsGameActive(true);
    setShowIntro(false);
    setGameOver(false);
    setVictory(false);
    
    // Reset game state
    setPlayerHealth(100);
    setHemingwayHealth(100);
    setBullets([]);
    setEnemies([]);
    setItems([]);
    
    // Initialize level with appropriate values
    initializeLevelDesign(currentLevel);
    
    // Spawn initial enemies
    spawnEnemies();
    
    // Display a random Hemingway quote on start
    setTimeout(() => {
      displayRandomQuote('random');
    }, 2000);
  };
  
  // Main game loop
  const gameLoop = () => {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastFrameTimeRef.current) / 16.67; // normalize to ~60fps
    
    updateGameState(deltaTime);
    renderGame();
    
    // Random Hemingway quotes during gameplay (no more than once every 30 seconds)
    const currentTimeForQuotes = Date.now();
    if (currentTimeForQuotes - lastFrameTimeRef.current > 30000 && Math.random() < 0.02) {
      displayRandomQuote('random');
      lastFrameTimeRef.current = currentTimeForQuotes;
    }
    
    // Update the XP bar calculation
    const xpBar = document.querySelector('.xp-bar-inner');
    if (xpBar) {
      const nextLevelThreshold = levelThresholds[playerLevel];
      const currentLevelThreshold = levelThresholds[playerLevel - 1] || 0;
      const percentage = ((playerXP - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold)) * 100;
      xpBar.style.width = `${Math.min(100, percentage)}%`;
    }
    
    lastFrameTimeRef.current = currentTime;
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };
  
  // Handle player keyboard input
  const handleKeyDown = (e) => {
    keysPressed.current[e.key] = true;
    
    // Shooting
    if (e.key === ' ' || e.key === 'Control') {
      shootBullet('player');
      setIsShooting(true);
    }
    
    // Jumping
    if ((e.key === 'ArrowUp' || e.key === 'w') && !isJumping) {
      jump();
    }
    
    // Crouching
    if (e.key === 'ArrowDown' || e.key === 's') {
      setIsCrouching(true);
    }
  };
  
  const handleKeyUp = (e) => {
    keysPressed.current[e.key] = false;
    
    // Stop shooting
    if (e.key === ' ' || e.key === 'Control') {
      setIsShooting(false);
    }
    
    // Stop crouching
    if (e.key === 'ArrowDown' || e.key === 's') {
      setIsCrouching(false);
    }
  };
  
  // Handle player jumping
  const jump = () => {
    if (!isJumping) {
      setIsJumping(true);
      setPlayerPosition(prev => ({ ...prev, velocityY: JUMP_FORCE }));
      playGameSound('jump');
    }
  };
  
  // Spawn enemies
  const spawnEnemies = () => {
    // Create enemies based on level
    const enemyCount = Math.min(5 + currentLevel, 10);
    
    const newEnemies = [];
    for (let i = 0; i < enemyCount; i++) {
      let enemyType = 'grunt'; // Default type
      
      // Vary enemy types by level
      const typeRoll = Math.random();
      if (currentLevel === 1) {
        // Level 1: Mostly grunts with a few soldiers
        enemyType = typeRoll > 0.8 ? 'soldier' : 'grunt';
      } else if (currentLevel === 2) {
        // Level 2: More soldiers and introduce snipers
        if (typeRoll > 0.6) enemyType = 'soldier';
        else if (typeRoll > 0.85) enemyType = 'sniper';
        else enemyType = 'grunt';
      } else if (currentLevel === 3) {
        // Level 3: All types with more challenging ones
        if (typeRoll > 0.5) enemyType = 'soldier';
        else if (typeRoll > 0.75) enemyType = 'sniper';
        else if (typeRoll > 0.9) enemyType = 'tank';
        else enemyType = 'grunt';
      }
      
      // Create enemy object with type-specific properties
      const enemy = {
        id: `enemy-${Date.now()}-${i}`,
        x: 800 + Math.random() * 1000,
        y: 300 - Math.random() * 150,
        health: enemyType === 'tank' ? 100 : 
                enemyType === 'soldier' ? 40 : 
                enemyType === 'sniper' ? 20 : 30,
        type: enemyType,
        direction: Math.random() > 0.5 ? 'left' : 'right',
        // Type-specific properties
        shootRange: enemyType === 'sniper' ? 500 : 300,
        moveSpeed: enemyType === 'tank' ? 1 : 
                   enemyType === 'sniper' ? 0.5 : 2,
        shootCooldown: enemyType === 'sniper' ? 3000 : 
                      enemyType === 'tank' ? 2000 : 1500,
        lastShot: 0
      };
      
      newEnemies.push(enemy);
    }
    
    setEnemies(newEnemies);
    
    // Activate boss at level milestone
    if (currentLevel >= 3 && !bossActive) {
      setBossActive(true);
      
      // Select boss type based on level
      setBossType(currentLevel === 3 ? 'lion' : 'general');
    }
  };
  
  // Handle shooting
  const shootBullet = (shooter, special = false) => {
    let bulletX, bulletY, bulletDirection, bulletSpeed, bulletDamage, bulletClass;
    
    // Default bullet properties
    bulletSpeed = BULLET_SPEED;
    bulletDamage = 10;
    bulletClass = '';
    
    if (shooter === 'player') {
      bulletX = playerDirection === 'right' ? playerPosition.x + 50 : playerPosition.x - 10;
      bulletY = playerPosition.y + 25;
      bulletDirection = playerDirection;
      
      // Apply powerups
      if (playerPowerups.rapidFire.active) {
        bulletSpeed *= 1.5;
      }
      
      if (special) {
        bulletClass = 'special';
        bulletDamage = 30;
      }
      
      // Add experience for player shooting
      setPlayerXP(prev => prev + 1);
      
    } else if (shooter === 'hemingway') {
      bulletX = hemingwayDirection === 'right' ? hemingwayPosition.x + 50 : hemingwayPosition.x - 10;
      bulletY = hemingwayPosition.y + 25;
      bulletDirection = hemingwayDirection;
      
      // Hemingway's shots are stronger
      bulletDamage = 15;
      
      if (special) {
        bulletClass = 'hemingway-special';
        bulletDamage = 40;
      }
      
    } else if (shooter.startsWith('enemy-')) {
      // Find enemy by ID
      const enemy = enemies.find(e => e.id === shooter);
      if (enemy) {
        bulletX = enemy.direction === 'right' ? enemy.x + 30 : enemy.x - 10;
        bulletY = enemy.y + 20;
        bulletDirection = enemy.direction;
        
        // Enemy-specific bullet properties
        if (enemy.type === 'sniper') {
          bulletSpeed *= 1.5;
          bulletDamage = 20;
          bulletClass = 'sniper';
        } else if (enemy.type === 'tank') {
          bulletSpeed *= 0.8;
          bulletDamage = 25;
          bulletClass = 'tank';
        }
      }
    } else if (shooter === 'boss') {
      bulletX = bossPosition.x;
      bulletY = bossPosition.y + 40;
      bulletDirection = 'left';
      bulletDamage = 25;
      bulletClass = 'boss';
      
      if (special) {
        bulletClass = 'boss-special';
        bulletDamage = 40;
        bulletSpeed *= 0.7;
      }
    }
    
    const newBullet = {
      id: `bullet-${Date.now()}-${Math.random()}`,
      x: bulletX,
      y: bulletY,
      direction: bulletDirection,
      shooter,
      speed: bulletSpeed,
      damage: bulletDamage,
      class: bulletClass
    };
    
    setBullets(prev => [...prev, newBullet]);
    
    // Play sound effect
    playGameSound(special ? 'special-shoot' : 'shoot');
  };
  
  // Update game state
  const updateGameState = (deltaTime) => {
    if (!isGameActive || gameOver) return;
    
    // Update player position based on input
    updatePlayerPosition(deltaTime);
    
    // Update Hemingway AI
    updateHemingwayAI(deltaTime);
    
    // Update bullets
    updateBullets(deltaTime);
    
    // Update enemies
    updateEnemies(deltaTime);
    
    // Check collisions
    checkCollisions();
    
    // Check level completion
    checkLevelCompletion();
    
    // Check game over conditions
    if (playerHealth <= 0) {
      setGameOver(true);
    }
    
    // Check for low health to trigger quote
    if (playerHealth <= 25 && Math.random() < 0.005) {
      displayRandomQuote('lowHealth');
    }
  };
  
  // Update player position based on input
  const updatePlayerPosition = (deltaTime) => {
    let dx = 0;
    let dy = 0;
    
    // Horizontal movement
    if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) {
      dx -= PLAYER_SPEED * deltaTime;
      setPlayerDirection('left');
    }
    if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) {
      dx += PLAYER_SPEED * deltaTime;
      setPlayerDirection('right');
    }
    
    // Apply gravity
    dy += GRAVITY * deltaTime;
    
    // Check platform collisions for player
    const onGround = checkOnGround(playerPosition);
    const platformType = getStandingPlatformType(playerPosition);
    
    // Special platform effects
    if (platformType === 'water' && !onGround) {
      // Slow down in water
      dx *= 0.5;
      dy *= 0.7;
      // Gradual health reduction in water
      if (Math.random() < 0.05) {
        setPlayerHealth(prev => Math.max(0, prev - 1));
      }
    } else if (platformType === 'trench') {
      // Provide cover in trenches
      if (isCrouching) {
        // Reduced chance of being hit when crouched in trench
        // This is handled in bullet collision detection
      }
    }
    
    if (onGround && dy > 0) {
      dy = 0;
    }
    
    // Update player position with level boundary checking
    setPlayerPosition(prev => ({
      x: Math.max(0, Math.min(800, prev.x + dx)),
      y: Math.max(0, Math.min(350, prev.y + dy))
    }));
  };
  
  // Get the type of platform the entity is standing on
  const getStandingPlatformType = (position) => {
    for (const platform of platforms) {
      if (
        position.y + 50 >= platform.y && 
        position.y + 50 <= platform.y + 10 &&
        position.x + 30 >= platform.x && 
        position.x <= platform.x + platform.width
      ) {
        return platform.type;
      }
    }
    return null;
  };
  
  // Update Hemingway AI
  const updateHemingwayAI = (deltaTime) => {
    // Hemingway follows the player with a delay
    const targetX = playerPosition.x - 70;
    const dx = (targetX - hemingwayPosition.x) * 0.05 * deltaTime;
    
    // Update direction
    if (dx < 0) {
      setHemingwayDirection('left');
    } else if (dx > 0) {
      setHemingwayDirection('right');
    }
    
    // Apply gravity
    let dy = GRAVITY * deltaTime;
    
    // Check platform collisions for Hemingway
    const onGround = checkOnGround(hemingwayPosition);
    
    if (onGround && dy > 0) {
      dy = 0;
    }
    
    // Update Hemingway position
    setHemingwayPosition(prev => ({
      x: Math.max(0, Math.min(800, prev.x + dx)),
      y: Math.max(0, Math.min(350, prev.y + dy))
    }));
    
    // Hemingway sometimes shoots at enemies
    if (Math.random() < 0.02 && enemies.length > 0) {
      shootBullet('hemingway');
      setHemingwayIsShooting(true);
      
      // Reset shooting animation
      setTimeout(() => {
        setHemingwayIsShooting(false);
      }, 200);
    }
  };
  
  // Update bullets
  const updateBullets = (deltaTime) => {
    setBullets(prev => prev.map(bullet => {
      // Use bullet's custom speed if available, otherwise default
      const speed = bullet.speed || BULLET_SPEED;
      const dx = bullet.direction === 'right' ? speed * deltaTime : -speed * deltaTime;
      
      // Special bullet effects
      if (bullet.class === 'boss-special') {
        // Boss special bullets follow the player
        let targetX = playerPosition.x;
        let targetY = playerPosition.y + 25;
        
        // Calculate angle to player
        const angle = Math.atan2(targetY - bullet.y, targetX - bullet.x);
        
        // Move bullet toward player with slight homing effect
        return { 
          ...bullet, 
          x: bullet.x + Math.cos(angle) * speed * 0.5 * deltaTime,
          y: bullet.y + Math.sin(angle) * speed * 0.5 * deltaTime
        };
      }
      
      return { ...bullet, x: bullet.x + dx };
    }).filter(bullet => bullet.x > -20 && bullet.x < 820 && bullet.y > 0 && bullet.y < 400));
  };
  
  // Update enemies
  const updateEnemies = (deltaTime) => {
    setEnemies(prev => prev.map(enemy => {
      // Enemy type-specific behavior
      let dx = 0;
      let dy = 0;
      const playerInRange = Math.abs(enemy.x - playerPosition.x) < enemy.shootRange;
      const timeToShoot = Date.now() - (enemy.lastShot || 0) > enemy.shootCooldown;
      
      // Movement based on enemy type
      switch(enemy.type) {
        case 'grunt':
          // Basic movement - approach player when in range
          if (playerInRange) {
            dx = enemy.x > playerPosition.x ? -1 : 1;
            enemy.direction = dx > 0 ? 'right' : 'left';
            
            // Occasionally shoot at player
            if (timeToShoot && Math.random() < 0.3) {
              shootBullet(enemy.id);
              enemy.lastShot = Date.now();
            }
          } else {
            // Random movement
            dx = enemy.direction === 'right' ? 1 : -1;
            
            // Randomly change direction
            if (Math.random() < 0.01) {
              enemy.direction = enemy.direction === 'right' ? 'left' : 'right';
            }
          }
          break;
          
        case 'soldier':
          // More tactical - keeps distance and shoots more frequently
          if (playerInRange) {
            // Keep optimal distance
            const distanceToPlayer = Math.abs(enemy.x - playerPosition.x);
            if (distanceToPlayer < 150) {
              // Back away
              dx = enemy.x > playerPosition.x ? 1 : -1;
            } else if (distanceToPlayer > 250) {
              // Get closer
              dx = enemy.x > playerPosition.x ? -1 : 1;
            }
            enemy.direction = playerPosition.x > enemy.x ? 'right' : 'left';
            
            // Shoot more frequently
            if (timeToShoot && Math.random() < 0.5) {
              shootBullet(enemy.id);
              enemy.lastShot = Date.now();
            }
          } else {
            // Patrol behavior
            dx = enemy.direction === 'right' ? 1 : -1;
            
            // Change direction at obstacles or randomly
            if (Math.random() < 0.02) {
              enemy.direction = enemy.direction === 'right' ? 'left' : 'right';
            }
          }
          break;
          
        case 'sniper':
          // Stays still when player in range, high damage shots
          if (playerInRange) {
            dx = 0; // Don't move when targeting
            enemy.direction = playerPosition.x > enemy.x ? 'right' : 'left';
            
            // Take careful shots
            if (timeToShoot && Math.random() < 0.7) {
              shootBullet(enemy.id);
              enemy.lastShot = Date.now();
            }
          } else {
            // Move to find good position
            dx = enemy.direction === 'right' ? 0.5 : -0.5;
            
            // Change direction occasionally
            if (Math.random() < 0.03) {
              enemy.direction = enemy.direction === 'right' ? 'left' : 'right';
            }
          }
          break;
          
        case 'tank':
          // Slow but powerful, fires heavy shots
          dx = enemy.direction === 'right' ? 0.5 : -0.5;
          
          if (playerInRange) {
            enemy.direction = playerPosition.x > enemy.x ? 'right' : 'left';
            
            // Heavy shots at intervals
            if (timeToShoot) {
              shootBullet(enemy.id, true); // Special bullet
              enemy.lastShot = Date.now();
            }
          }
          
          // Rarely changes direction
          if (Math.random() < 0.01) {
            enemy.direction = enemy.direction === 'right' ? 'left' : 'right';
          }
          break;
      }
      
      // Apply gravity
      dy += GRAVITY * deltaTime;
      
      // Check platform collisions
      const onGround = checkOnGround({ x: enemy.x, y: enemy.y });
      if (onGround && dy > 0) {
        dy = 0;
      }
      
      // Apply movement with type-specific speed
      return { 
        ...enemy, 
        x: enemy.x + dx * enemy.moveSpeed * deltaTime,
        y: Math.max(0, Math.min(350, enemy.y + dy))
      };
    }));
    
    // Update boss if active
    if (bossActive) {
      updateBoss(deltaTime);
    }
  };
  
  // Update boss behavior
  const updateBoss = (deltaTime) => {
    // Boss movement pattern based on phase and boss type
    const bossPhase = Math.floor((bossHealth / 100) * 3); // 0-2 phases based on health
    let dx = 0;
    let dy = 0;
    
    const bossBehaviors = {
      lion: [
        // Phase 1: Regular movement
        () => {
          if (Date.now() % 6000 < 3000) {
            dx = -1; // Move left
          } else {
            dx = 1; // Move right
          }
          
          // Jump occasionally
          if (Date.now() % 4000 < 50) {
            setBossJumping(true);
            bossVelocityY = -15;
          }
          
          // Standard attack pattern
          if (Date.now() % 2000 < 50) {
            shootBullet('boss');
          }
        },
        // Phase 2: More aggressive
        () => {
          // More erratic movement
          dx = Math.sin(Date.now() / 500) * 2;
          
          // Jump more often
          if (Date.now() % 3000 < 50) {
            setBossJumping(true);
            bossVelocityY = -15;
          }
          
          // Attack more frequently
          if (Date.now() % 1500 < 50) {
            shootBullet('boss');
          }
        },
        // Phase 3: Desperate attacks
        () => {
          // Rapid movement
          dx = Math.sin(Date.now() / 300) * 3;
          
          // Frequent jumps
          if (Date.now() % 2000 < 50) {
            setBossJumping(true);
            bossVelocityY = -15;
          }
          
          // Special attacks
          if (Date.now() % 4000 < 100) {
            // Burst fire
            setTimeout(() => shootBullet('boss'), 0);
            setTimeout(() => shootBullet('boss'), 200);
            setTimeout(() => shootBullet('boss'), 400);
          }
          
          // Occasional special attack
          if (Date.now() % 8000 < 50) {
            shootBullet('boss', true);
          }
        }
      ],
      general: [
        // Different patterns for the general boss
        // Phase 1
        () => {
          // Strategic movement
          if (playerPosition.x < bossPosition.x - 100) {
            dx = -0.5; // Advance toward player
          } else if (playerPosition.x > bossPosition.x + 100) {
            dx = 0.5; // Back away from player
          }
          
          // Standard attack pattern
          if (Date.now() % 2500 < 50) {
            shootBullet('boss');
          }
        },
        // Phase 2
        () => {
          // Call reinforcements
          if (Date.now() % 10000 < 50 && enemies.length < 5) {
            // Spawn a supporting enemy
            setEnemies(prev => [...prev, {
              id: `enemy-${Date.now()}`,
              x: bossPosition.x,
              y: bossPosition.y + 50,
              health: 30,
              type: 'soldier',
              direction: 'left',
              shootRange: 300,
              moveSpeed: 2,
              shootCooldown: 1500,
              lastShot: 0
            }]);
          }
          
          // Tactical movement
          dx = Math.sin(Date.now() / 800);
          
          // Targeted attacks
          if (Date.now() % 2000 < 50) {
            shootBullet('boss');
          }
        },
        // Phase 3
        () => {
          // Erratic movement
          dx = Math.sin(Date.now() / 400) * 1.5;
          
          // Heavy attacks
          if (Date.now() % 3000 < 50) {
            shootBullet('boss', true);
          }
          
          // Regular attacks
          if (Date.now() % 1000 < 50) {
            shootBullet('boss');
          }
        }
      ]
    };
    
    // Call the appropriate behavior function based on boss type and phase
    const bossType = bossType || 'lion';
    bossBehaviors[bossType][Math.min(bossPhase, 2)]();
    
    // Apply boss movement
    setBossPosition(prev => ({
      x: Math.max(1600, Math.min(1900, prev.x + dx * deltaTime)),
      y: Math.max(200, Math.min(300, prev.y + dy * deltaTime))
    }));
  };
  
  // Check if entity is on ground or platform
  const checkOnGround = (position) => {
    return platforms.some(platform => 
      position.y + 50 >= platform.y && 
      position.y + 50 <= platform.y + 10 &&
      position.x + 30 >= platform.x && 
      position.x <= platform.x + platform.width
    );
  };
  
  // Check collisions
  const checkCollisions = () => {
    // Check bullet collisions with enemies
    bullets.forEach(bullet => {
      if (bullet.shooter === 'player' || bullet.shooter === 'hemingway') {
        // Check against enemies
        enemies.forEach(enemy => {
          if (
            bullet.x >= enemy.x && 
            bullet.x <= enemy.x + 40 && 
            bullet.y >= enemy.y && 
            bullet.y <= enemy.y + 40
          ) {
            // Remove bullet
            setBullets(prev => prev.filter(b => b.id !== bullet.id));
            
            // Calculate damage based on bullet type
            let damage = bullet.damage || 10;
            
            // Apply player level bonus
            damage += Math.floor(playerLevel / 2);
            
            // Critical hits for special bullets
            const isCritical = bullet.class?.includes('special') && Math.random() < 0.3;
            if (isCritical) {
              damage *= 2;
              // Visual effect for critical hit could be added here
              
              // Chance to display quote on critical hit
              if (Math.random() < 0.3) {
                displayRandomQuote('criticalHit');
              }
            }
            
            // Damage enemy
            setEnemies(prev => prev.map(e => {
              if (e.id === enemy.id) {
                return { ...e, health: e.health - damage };
              }
              return e;
            }).filter(e => e.health > 0));
            
            // Grant XP for hit
            setPlayerXP(prev => prev + 5);
            
            // If enemy is defeated, grant additional XP
            if (enemy.health - damage <= 0) {
              setPlayerXP(prev => prev + 10 + (enemy.type === 'tank' ? 20 : enemy.type === 'sniper' ? 15 : enemy.type === 'soldier' ? 10 : 5));
            }
            
            // Increase score based on damage
            setScore(prev => prev + Math.floor(damage));
            
            // Play hit sound
            playGameSound(isCritical ? 'criticalHit' : 'hit');
          }
        });
        
        // Check against boss
        if (bossActive && 
            bullet.x >= bossPosition.x && 
            bullet.x <= bossPosition.x + 100 && 
            bullet.y >= bossPosition.y && 
            bullet.y <= bossPosition.y + 100
        ) {
          // Remove bullet
          setBullets(prev => prev.filter(b => b.id !== bullet.id));
          
          // Calculate damage with level bonus
          let damage = (bullet.damage || 5) + Math.floor(playerLevel / 3);
          
          // If this is the first hit on the boss, show a quote
          if (bossHealth === 500) {
            displayRandomQuote('boss');
          }
          
          // Critical hits
          const isCritical = bullet.class?.includes('special') && Math.random() < 0.2;
          if (isCritical) {
            damage *= 1.5;
            
            // Chance to display quote on critical hit
            if (Math.random() < 0.3) {
              displayRandomQuote('criticalHit');
            }
          }
          
          // Damage boss
          setBossHealth(prev => Math.max(0, prev - damage));
          
          // Grant XP for boss hit
          setPlayerXP(prev => prev + 10);
          
          // Increase score
          setScore(prev => prev + Math.floor(damage));
          
          // Play hit sound
          playGameSound(isCritical ? 'boss-criticalHit' : 'bossHit');
          
          // Check if boss is defeated
          if (bossHealth - damage <= 0) {
            setBossActive(false);
            setScore(prev => prev + 500);
            setPlayerXP(prev => prev + 300); // Big XP bonus for defeating boss
            setVictory(true);
            
            // Victory quote
            displayRandomQuote('victory');
            
            // Play victory sound
            playGameSound('bossDefeated');
          }
        }
      } else if (bullet.shooter === 'boss' || bullet.shooter.startsWith('enemy-')) {
        // Check against player
        if (
          bullet.x >= playerPosition.x && 
          bullet.x <= playerPosition.x + 40 && 
          bullet.y >= playerPosition.y && 
          bullet.y <= playerPosition.y + 50
        ) {
          // Remove bullet
          setBullets(prev => prev.filter(b => b.id !== bullet.id));
          
          // Calculate damage
          let damage = bullet.damage || 10;
          
          // Reduce damage if player has shield powerup
          if (playerPowerups.shield.active) {
            damage = Math.floor(damage * 0.5);
            // Visual shield effect
          }
          
          // Apply damage to player
          setPlayerHealth(prev => Math.max(0, prev - damage));
          
          // Play hit sound
          playGameSound('playerHit');
        }
        
        // Check against Hemingway
        if (
          bullet.x >= hemingwayPosition.x && 
          bullet.x <= hemingwayPosition.x + 40 && 
          bullet.y >= hemingwayPosition.y && 
          bullet.y <= hemingwayPosition.y + 50
        ) {
          // Remove bullet
          setBullets(prev => prev.filter(b => b.id !== bullet.id));
          
          // Damage Hemingway
          setHemingwayHealth(prev => Math.max(0, prev - (bullet.damage || 5)));
          
          // Play hit sound
          playGameSound('hemingwayHit');
        }
      }
    });
    
    // Check item collisions with player
    setItems(prev => prev.map(item => {
      if (
        !item.collected &&
        playerPosition.x + 30 >= item.x && 
        playerPosition.x <= item.x + 30 && 
        playerPosition.y + 50 >= item.y && 
        playerPosition.y <= item.y + 30
      ) {
        // Apply item effect
        switch (item.type) {
          case 'health':
            setPlayerHealth(prev => Math.min(100, prev + 20));
            playGameSound('healthPickup');
            break;
          case 'weapon':
            // Activate rapid fire powerup
            setPlayerPowerups(prev => ({...prev, rapidFire: { active: true, timeLeft: 15 }}));
            setTimeout(() => {
              setPlayerPowerups(prev => ({...prev, rapidFire: { active: false, timeLeft: 0 }}));
            }, 15000); // 15 seconds
            playGameSound('weaponPickup');
            setPlayerXP(prev => prev + 15); // XP for weapon pickup
            break;
          case 'ammo':
            // Create a special shot
            setTimeout(() => shootBullet('player', true), 100);
            playGameSound('ammoPickup');
            setPlayerXP(prev => prev + 5); // XP for ammo pickup
            break;
          case 'manuscript':
            // Increase score and XP
            setScore(prev => prev + 100);
            setPlayerXP(prev => prev + 25); // XP for manuscript pickup
            playGameSound('manuscriptPickup');
            break;
          case 'powerup':
            // Apply specific powerup and grant XP
            if (item.variant === 'speed') {
              setPlayerPowerups(prev => ({...prev, speedBoost: { active: true, timeLeft: 10 }}));
              setTimeout(() => {
                setPlayerPowerups(prev => ({...prev, speedBoost: { active: false, timeLeft: 0 }}));
              }, 10000); // 10 seconds
            } else if (item.variant === 'shield') {
              setPlayerPowerups(prev => ({...prev, shield: { active: true, timeLeft: 10 }}));
              setTimeout(() => {
                setPlayerPowerups(prev => ({...prev, shield: { active: false, timeLeft: 0 }}));
              }, 10000); // 10 seconds
            }
            setPlayerXP(prev => prev + 20); // XP for powerup pickup
            playGameSound('powerupPickup');
            break;
        }
        
        return { ...item, collected: true };
      }
      return item;
    }));
  };
  
  // Check level completion
  const checkLevelCompletion = () => {
    // Level is complete when all enemies are defeated or boss is defeated
    if (enemies.length === 0 && !bossActive) {
      if (currentLevel < 3) {
        // Move to next level
        setCurrentLevel(prev => prev + 1);
        
        // Grant XP for completing level
        setPlayerXP(prev => prev + 100 * currentLevel);
        
        // Spawn new enemies
        spawnEnemies();
      } else if (!victory) {
        // Game complete
        setVictory(true);
        
        // Final XP bonus
        setPlayerXP(prev => prev + 500);
      }
    }
  };
  
  // Render game (this would typically use canvas or DOM elements)
  const renderGame = () => {
    // This is a placeholder for actual rendering
    console.log('Rendering game frame');
  };
  
  // Handle level completion
  const handleComplete = () => {
    if (onComplete) {
      onComplete(score);
    }
  };
  
  // Handle exit
  const handleExit = () => {
    if (onExit) {
      onExit();
    }
  };
  
  // Check for player level ups
  useEffect(() => {
    // Check if player has enough XP to level up
    if (playerLevel < levelThresholds.length - 1 && playerXP >= levelThresholds[playerLevel]) {
      // Level up
      setPlayerLevel(prev => prev + 1);
      setShowLevelUp(true);
      
      // Play level up sound
      playGameSound('levelUp');
      
      // Display a random Hemingway quote
      displayRandomQuote('levelUp');
      
      // Hide level up message after a delay
      setTimeout(() => {
        setShowLevelUp(false);
      }, 4000);
      
      // Grant level up bonus
      applyLevelUpBonus();
    }
  }, [playerXP, playerLevel]);
  
  // Apply level up bonuses
  const applyLevelUpBonus = () => {
    // Play level up sound
    playGameSound('levelUp');
    
    // Determine bonus based on current level
    const bonusType = Math.floor(Math.random() * 3);
    
    switch(bonusType) {
      case 0:
        // Health bonus
        setPlayerHealth(prev => Math.min(100, prev + 25));
        setPlayerMessage("Health boost!");
        break;
      case 1:
        // Temporary power-up - rapid fire
        setPlayerPowerups(prev => ({
          ...prev,
          rapidFire: { active: true, timeLeft: 10000 }
        }));
        setPlayerMessage("Rapid fire activated!");
        break;
      case 2:
        // Temporary shield
        setPlayerPowerups(prev => ({
          ...prev,
          shield: { active: true, timeLeft: 8000 }
        }));
        setPlayerMessage("Shield activated!");
        break;
    }
    
    // Give extra ammo
    setSpecialAmmo(prev => prev + 2);
    
    // Show message for a while
    setTimeout(() => {
      setPlayerMessage("");
    }, 3000);
  };
  
  // Handle player death
  const handlePlayerDeath = () => {
    if (!gameOver) {
      // Play game over sound
      playGameSound('gameOver');
      
      // Display death quote
      displayRandomQuote('death');
      
      // Set game over after a short delay
      setTimeout(() => {
        setGameOver(true);
      }, 1500);
    }
  };
  
  // Update player health check in the game loop to use handlePlayerDeath
  useEffect(() => {
    if (playerHealth <= 0 && !gameOver) {
      handlePlayerDeath();
    }
    
    // Health low warning quote
    if (playerHealth < 30 && !showQuote && Math.random() < 0.02) {
      displayRandomQuote('lowHealth');
    }
  }, [playerHealth, gameOver, showQuote]);
  
  // Display a random Hemingway quote based on game event
  const displayRandomQuote = (context) => {
    let relevantQuotes = [];
    
    // Select quotes based on context
    switch(context) {
      case 'levelUp':
        relevantQuotes = hemingwayQuotes.filter(q => q.themes.includes('triumph') || q.themes.includes('courage'));
        break;
      case 'criticalHit':
        relevantQuotes = hemingwayQuotes.filter(q => q.themes.includes('battle') || q.themes.includes('blood'));
        // Play critical hit sound for quotes about battle
        playGameSound('criticalHit', 0.4);
        break;
      case 'lowHealth':
        relevantQuotes = hemingwayQuotes.filter(q => q.themes.includes('death') || q.themes.includes('pain'));
        break;
      case 'death':
        relevantQuotes = hemingwayQuotes.filter(q => q.themes.includes('death') || q.themes.includes('loss'));
        break;
      case 'victory':
        relevantQuotes = hemingwayQuotes.filter(q => q.themes.includes('triumph') || q.themes.includes('victory'));
        // Play victory sound for victory quotes
        playGameSound('victory', 0.6);
        break;
      default:
        relevantQuotes = hemingwayQuotes;
    }
    
    // Select a random quote from relevant ones or fallback to any quote
    const selectedQuote = relevantQuotes.length > 0
      ? relevantQuotes[Math.floor(Math.random() * relevantQuotes.length)]
      : hemingwayQuotes[Math.floor(Math.random() * hemingwayQuotes.length)];
      
    // Display the quote
    setCurrentQuote(selectedQuote);
    setShowQuote(true);
    
    // Hide quote after 5 seconds
    setTimeout(() => {
      setShowQuote(false);
    }, 5000);
  };
  
  // Create a wrapper function to play sounds using our mapping
  const playGameSound = (type, volume = 0.5) => {
    const soundId = SOUND_MAPPING[type];
    if (soundId) {
      playSound(soundId, volume);
    } else {
      console.log(`No sound mapping found for: ${type}`);
    }
  };
  
  // Update enemy defeated handler to award XP
  const handleEnemyDefeated = (enemy) => {
    // Award XP based on enemy type
    let xpGain = 0;
    switch(enemy.type) {
      case 'grunt':
        xpGain = 10;
        setScore(prevScore => prevScore + 10);
        break;
      case 'soldier':
        xpGain = 20;
        setScore(prevScore => prevScore + 20);
        break;
      case 'sniper':
        xpGain = 30;
        setScore(prevScore => prevScore + 30);
        break;
      case 'tank':
        xpGain = 50;
        setScore(prevScore => prevScore + 50);
        break;
      default:
        xpGain = 10;
        setScore(prevScore => prevScore + 10);
    }
    
    // Award XP
    setPlayerXP(prevXP => prevXP + xpGain);
    
    // Random chance for Hemingway quote after defeating enemy
    if (Math.random() < 0.2) {
      displayRandomQuote('criticalHit');
    }
    
    // Update enemy counter
    setEnemiesDefeated(prevCount => prevCount + 1);
  };
  
  // Update the boss defeated handler 
  const handleBossDefeated = () => {
    // Award score and XP for defeating boss
    const scoreGain = currentLevel * 200;
    setScore(prevScore => prevScore + scoreGain);
    
    // Award significant XP for defeating a boss
    const xpGain = currentLevel * 100;
    setPlayerXP(prevXP => prevXP + xpGain);
    
    // Play boss defeated sound
    playGameSound('bossDefeated');
    
    // Display victory quote
    displayRandomQuote('victory');
    
    // Boss is defeated, show victory or advance to next level
    if (currentLevel === 3) {
      // Final level completed
      setTimeout(() => {
        // Play victory sound
        playGameSound('victory');
        setVictory(true);
      }, 2000);
    } else {
      // Complete level and advance
      setTimeout(() => {
        handleLevelCompletion();
      }, 2000);
    }
  };
  
  // Add helper function to get level name
  const getLevelName = (level) => {
    switch(level) {
      case 1: 
        return "Paris Cafes";
      case 2: 
        return "Spanish Civil War";
      case 3: 
        return "African Safari";
      default: 
        return `Level ${level}`;
    }
  };
  
  // Add a function to handle level completion
  const handleLevelCompletion = () => {
    // Award XP for level completion
    const levelCompletionXP = currentLevel * 50;
    setPlayerXP(prevXP => prevXP + levelCompletionXP);
    
    // Award score bonus for completing level
    const levelCompletionScore = currentLevel * 100;
    setScore(prevScore => prevScore + levelCompletionScore);
    
    // If final level, show victory
    if (currentLevel === 3) {
      // Display victory quote
      displayRandomQuote('victory');
      
      // Play victory sound
      playGameSound('victory');
      
      // Show victory screen after a delay
      setTimeout(() => {
        setVictory(true);
      }, 2000);
    } else {
      // Otherwise move to next level
      setCurrentLevel(prevLevel => prevLevel + 1);
      
      // Reset level-specific elements but keep progression
      resetLevelElements();
      
      // Play level up sound
      playGameSound('levelUp');
      
      // Display level transition quote
      displayRandomQuote('levelUp');
    }
  };
  
  // Add a reset level elements function
  const resetLevelElements = () => {
    // Reset game state for new level but keep progression
    setBullets([]);
    setEnemies([]);
    setItems([]);
    setPlatforms([]);
    setBossActive(false);
    setBossHealth(0);
    
    // Reset positions
    setPlayerPosition({x: 100, y: 300});
    setHemingwayPosition({x: 150, y: 300});
    
    // Restore some health
    setPlayerHealth(prevHealth => Math.min(prevHealth + 20, 100));
    setHemingwayHealth(prevHealth => Math.min(prevHealth + 20, 100));
    
    // Initialize new level
    initializeLevelDesign(currentLevel + 1);
    
    // Show brief intro for new level
    setShowIntro(true);
    setTimeout(() => setShowIntro(false), 3000);
  };
  
  return (
    <div className="level4-shooter">
      <div className="game-hud">
        <div className="health-bar">
          <div className="health-label">HEALTH</div>
          <div className="health-bar-outer">
            <div
              className="health-bar-inner"
              style={{
                width: `${(playerHealth / 100) * 100}%`,
                backgroundColor: playerHealth > 60
                  ? '#3f3'
                  : playerHealth > 30
                    ? '#ff3'
                    : '#f33'
              }}
            />
          </div>
        </div>
        
        <div className="player-level">
          WRITER LVL: {playerLevel}
        </div>
        
        <div className="xp-bar">
          <div
            className="xp-bar-inner"
            style={{
              width: playerLevel < levelThresholds.length - 1
                ? `${((playerXP - levelThresholds[playerLevel - 1] || 0) / 
                    (levelThresholds[playerLevel] - (levelThresholds[playerLevel - 1] || 0))) * 100}%`
                : '100%'
            }}
          />
        </div>
        
        <div className="score-display">
          SCORE: {score}
        </div>
        
        <div className="level-display">
          AREA: {currentLevel}
        </div>
        
        <div className="level-name">
          {getLevelName(currentLevel)}
        </div>
        
        {Object.keys(playerPowerups).filter(powerup => playerPowerups[powerup].active).length > 0 && (
          <div className="powerups">
            {playerPowerups.rapidFire.active && (
              <div className="powerup-icon rapid-fire" title="Rapid Fire">🔥</div>
            )}
            {playerPowerups.shield.active && (
              <div className="powerup-icon shield" title="Shield">🛡️</div>
            )}
            {playerPowerups.speedBoost.active && (
              <div className="powerup-icon speed" title="Speed Boost">⚡</div>
            )}
          </div>
        )}
        
        {bossActive && (
          <div className="boss-health-bar">
            <div className="health-label">BOSS: {bossType === 'lion' ? 'LION' : 'GENERAL'}</div>
            <div className="health-bar-outer boss">
              <div
                className="health-bar-inner"
                style={{
                  width: `${(bossHealth / 500) * 100}%`,
                  backgroundColor: bossHealth > 300
                    ? '#f33'
                    : bossHealth > 150
                      ? '#f63'
                      : '#f93'
                }}
              />
            </div>
          </div>
        )}
      </div>
      
      <div
        className={`game-canvas-container ${
          currentLevel === 1
            ? 'paris-background'
            : currentLevel === 2
              ? 'spain-background'
              : 'africa-background'
        }`}
        ref={canvasRef}
      >
        {/* Display quote bubble when a quote is shown */}
        {showQuote && currentQuote && (
          <div className="quote-container">
            <div className="quote-bubble">
              <p className="quote-text">"{currentQuote}"</p>
              <p className="quote-attribution">- Ernest Hemingway</p>
            </div>
          </div>
        )}

        {/* Level up notification */}
        {showLevelUp && (
          <div className="level-up-notification">
            <div className="level-up-content">
              <h3>LEVEL UP!</h3>
              <p>Your writing prowess has reached level {playerLevel}</p>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="game-canvas"
        />
      </div>
      
      {/* Rest of the game overlays */}
      {!isGameActive && !gameOver && !victory && (
        <div className="intro-overlay">
          <div className="intro-content">
            <h2>Hemingway's Adventure</h2>
            <p>Join Ernest Hemingway through the battlefields of his life!</p>
            <p>MOVEMENT: Arrow keys / WASD</p>
            <p>SHOOT: Space bar</p>
            <p>JUMP: Up arrow / W</p>
            <p>CROUCH: Down arrow / S (in trenches for cover)</p>
            <button onClick={startGame}>Begin Adventure</button>
          </div>
        </div>
      )}
      
      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-content">
            <h2>The End</h2>
            <p>"But man is not made for defeat. A man can be destroyed but not defeated."</p>
            <p>Final Score: {score}</p>
            <p>Writer Level: {playerLevel}</p>
            <button onClick={handleExit}>Exit</button>
          </div>
        </div>
      )}
      
      {victory && (
        <div className="victory-overlay">
          <div className="victory-content">
            <h2>Victory!</h2>
            <p>"There is nothing to writing. All you do is sit down at a typewriter and bleed."</p>
            <p>Writer Level: {playerLevel}</p>
            <p>XP Earned: {playerXP}</p>
            <p>Final Score: {score}</p>
            <button onClick={handleComplete}>Continue</button>
          </div>
        </div>
      )}
    </div>
  );
};

Level4Shooter.propTypes = {
  onComplete: PropTypes.func,
  onExit: PropTypes.func
};

export default Level4Shooter; 