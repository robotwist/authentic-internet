import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './Level4Shooter.css';

const Level4Shooter = ({ onComplete, onExit }) => {
  // Game state
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [victory, setVictory] = useState(false);
  const [level, setLevel] = useState(1);
  
  // Player state
  const [playerPosition, setPlayerPosition] = useState({ x: 100, y: 300 });
  const [playerHealth, setPlayerHealth] = useState(100);
  const [playerDirection, setPlayerDirection] = useState('right');
  const [isShooting, setIsShooting] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isCrouching, setIsCrouching] = useState(false);
  
  // Hemingway (companion) state
  const [hemingwayPosition, setHemingwayPosition] = useState({ x: 150, y: 300 });
  const [hemingwayHealth, setHemingwayHealth] = useState(100);
  const [hemingwayDirection, setHemingwayDirection] = useState('right');
  const [hemingwayIsShooting, setHemingwayIsShooting] = useState(false);
  
  // Game objects
  const [bullets, setBullets] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [items, setItems] = useState([]);
  const [bossActive, setBossActive] = useState(false);
  const [bossHealth, setBossHealth] = useState(500);
  const [bossPosition, setBossPosition] = useState({ x: 1800, y: 250 });
  
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
  
  // Initialize game
  useEffect(() => {
    // Create initial platforms
    const initialPlatforms = [
      { x: 0, y: 350, width: 2000, height: 50, type: 'ground' },
      { x: 300, y: 250, width: 200, height: 20, type: 'platform' },
      { x: 600, y: 200, width: 150, height: 20, type: 'platform' },
      { x: 900, y: 280, width: 100, height: 20, type: 'platform' },
      { x: 1200, y: 220, width: 250, height: 20, type: 'platform' },
      { x: 1600, y: 300, width: 400, height: 50, type: 'boss-platform' }
    ];
    
    setPlatforms(initialPlatforms);
    
    // Create initial items
    const initialItems = [
      { x: 350, y: 220, type: 'health', collected: false },
      { x: 700, y: 170, type: 'weapon', collected: false },
      { x: 1250, y: 190, type: 'health', collected: false }
    ];
    
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
  }, []);
  
  // Start the game
  const startGame = () => {
    setIsGameActive(true);
    lastFrameTimeRef.current = performance.now();
    gameLoop();
  };
  
  // Main game loop
  const gameLoop = () => {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastFrameTimeRef.current) / 16.67; // normalize to ~60fps
    
    updateGameState(deltaTime);
    renderGame();
    
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
      
      // Reset jumping state after animation completes
      setTimeout(() => {
        setIsJumping(false);
      }, 500);
    }
  };
  
  // Spawn enemies
  const spawnEnemies = () => {
    // Create enemies based on level
    const enemyCount = Math.min(5 + level, 10);
    
    const newEnemies = [];
    for (let i = 0; i < enemyCount; i++) {
      newEnemies.push({
        id: `enemy-${Date.now()}-${i}`,
        x: 800 + Math.random() * 1000,
        y: 300 - Math.random() * 150,
        health: 30,
        type: Math.random() > 0.7 ? 'soldier' : 'grunt',
        direction: Math.random() > 0.5 ? 'left' : 'right'
      });
    }
    
    setEnemies(newEnemies);
    
    // Activate boss at level milestone
    if (level >= 3 && !bossActive) {
      setBossActive(true);
    }
  };
  
  // Handle shooting
  const shootBullet = (shooter) => {
    let bulletX, bulletY, bulletDirection;
    
    if (shooter === 'player') {
      bulletX = playerDirection === 'right' ? playerPosition.x + 50 : playerPosition.x - 10;
      bulletY = playerPosition.y + 25;
      bulletDirection = playerDirection;
    } else if (shooter === 'hemingway') {
      bulletX = hemingwayDirection === 'right' ? hemingwayPosition.x + 50 : hemingwayPosition.x - 10;
      bulletY = hemingwayPosition.y + 25;
      bulletDirection = hemingwayDirection;
    } else if (shooter === 'enemy') {
      const enemy = enemies.find(e => e.id === shooter);
      if (enemy) {
        bulletX = enemy.direction === 'right' ? enemy.x + 30 : enemy.x - 10;
        bulletY = enemy.y + 20;
        bulletDirection = enemy.direction;
      }
    } else if (shooter === 'boss') {
      bulletX = bossPosition.x;
      bulletY = bossPosition.y + 40;
      bulletDirection = 'left';
    }
    
    const newBullet = {
      id: `bullet-${Date.now()}-${Math.random()}`,
      x: bulletX,
      y: bulletY,
      direction: bulletDirection,
      shooter
    };
    
    setBullets(prev => [...prev, newBullet]);
    
    // Play sound effect
    playSound('shoot');
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
    
    if (onGround && dy > 0) {
      dy = 0;
    }
    
    // Update player position
    setPlayerPosition(prev => ({
      x: Math.max(0, Math.min(800, prev.x + dx)),
      y: Math.max(0, Math.min(350, prev.y + dy))
    }));
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
      const dx = bullet.direction === 'right' ? BULLET_SPEED * deltaTime : -BULLET_SPEED * deltaTime;
      return { ...bullet, x: bullet.x + dx };
    }).filter(bullet => bullet.x > -20 && bullet.x < 820));
  };
  
  // Update enemies
  const updateEnemies = (deltaTime) => {
    setEnemies(prev => prev.map(enemy => {
      // Simple AI: move towards player
      const playerInRange = Math.abs(enemy.x - playerPosition.x) < 300;
      let dx = 0;
      
      if (playerInRange) {
        dx = enemy.x > playerPosition.x ? -1 : 1;
        enemy.direction = dx > 0 ? 'right' : 'left';
        
        // Occasionally shoot at player
        if (Math.random() < 0.01) {
          shootBullet(enemy.id);
        }
      } else {
        // Random movement
        dx = enemy.direction === 'right' ? 1 : -1;
        
        // Randomly change direction
        if (Math.random() < 0.01) {
          enemy.direction = enemy.direction === 'right' ? 'left' : 'right';
        }
      }
      
      return { 
        ...enemy, 
        x: enemy.x + dx * 2 * deltaTime
      };
    }));
    
    // Update boss if active
    if (bossActive) {
      // Boss movement pattern
      const bossPhase = Math.floor(Date.now() / 3000) % 3;
      let dx = 0;
      let dy = 0;
      
      switch (bossPhase) {
        case 0: // Move left
          dx = -1;
          break;
        case 1: // Move right
          dx = 1;
          break;
        case 2: // Up and down
          dy = Math.sin(Date.now() / 500) * 2;
          break;
      }
      
      setBossPosition(prev => ({
        x: Math.max(1600, Math.min(1800, prev.x + dx * deltaTime)),
        y: Math.max(200, Math.min(300, prev.y + dy * deltaTime))
      }));
      
      // Boss shoots at intervals
      if (Date.now() % 2000 < 50) {
        shootBullet('boss');
      }
    }
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
            
            // Damage enemy
            setEnemies(prev => prev.map(e => {
              if (e.id === enemy.id) {
                return { ...e, health: e.health - 10 };
              }
              return e;
            }).filter(e => e.health > 0));
            
            // Increase score
            setScore(prev => prev + 10);
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
          
          // Damage boss
          setBossHealth(prev => prev - 5);
          
          // Increase score
          setScore(prev => prev + 5);
          
          // Check if boss is defeated
          if (bossHealth <= 0) {
            setBossActive(false);
            setScore(prev => prev + 500);
            setVictory(true);
          }
        }
      } else if (bullet.shooter === 'enemy' || bullet.shooter === 'boss') {
        // Check against player
        if (
          bullet.x >= playerPosition.x && 
          bullet.x <= playerPosition.x + 40 && 
          bullet.y >= playerPosition.y && 
          bullet.y <= playerPosition.y + 50
        ) {
          // Remove bullet
          setBullets(prev => prev.filter(b => b.id !== bullet.id));
          
          // Damage player
          setPlayerHealth(prev => Math.max(0, prev - 10));
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
          setHemingwayHealth(prev => Math.max(0, prev - 5));
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
        if (item.type === 'health') {
          setPlayerHealth(prev => Math.min(100, prev + 20));
        } else if (item.type === 'weapon') {
          // Could upgrade weapon or give temporary power-up
          setScore(prev => prev + 50);
        }
        
        // Play sound
        playSound('pickup');
        
        return { ...item, collected: true };
      }
      return item;
    }));
  };
  
  // Check level completion
  const checkLevelCompletion = () => {
    // Level is complete when all enemies are defeated or boss is defeated
    if (enemies.length === 0 && !bossActive) {
      if (level < 3) {
        // Move to next level
        setLevel(prev => prev + 1);
        spawnEnemies();
      } else if (!victory) {
        // Game complete
        setVictory(true);
      }
    }
  };
  
  // Play sound effect
  const playSound = (type) => {
    // Implementation would depend on your sound system
    console.log(`Playing sound: ${type}`);
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
  
  return (
    <div className="level4-shooter">
      <div className="game-hud">
        <div className="health-bar">
          <div className="health-label">Player Health</div>
          <div className="health-bar-outer">
            <div 
              className="health-bar-inner" 
              style={{ width: `${playerHealth}%`, backgroundColor: playerHealth > 50 ? '#3f3' : '#f33' }}
            ></div>
          </div>
        </div>
        
        <div className="health-bar">
          <div className="health-label">Hemingway Health</div>
          <div className="health-bar-outer">
            <div 
              className="health-bar-inner" 
              style={{ width: `${hemingwayHealth}%`, backgroundColor: hemingwayHealth > 50 ? '#3f3' : '#f33' }}
            ></div>
          </div>
        </div>
        
        <div className="score-display">Score: {score}</div>
        <div className="level-display">Level: {level}</div>
        
        {bossActive && (
          <div className="boss-health-bar">
            <div className="health-label">Boss Health</div>
            <div className="health-bar-outer boss">
              <div 
                className="health-bar-inner" 
                style={{ width: `${bossHealth / 5}%`, backgroundColor: '#f33' }}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="game-canvas-container">
        <canvas ref={canvasRef} width={800} height={400} className="game-canvas" />
        
        {/* Game elements - in a real implementation, these would be rendered on canvas */}
        <div className="player" style={{ 
          left: `${playerPosition.x}px`, 
          top: `${playerPosition.y}px`,
          transform: `scaleX(${playerDirection === 'right' ? 1 : -1})`,
          animation: isJumping ? 'player-jump 0.5s' : isShooting ? 'player-shoot 0.2s' : 'player-idle 1s infinite'
        }}></div>
        
        <div className="hemingway" style={{ 
          left: `${hemingwayPosition.x}px`, 
          top: `${hemingwayPosition.y}px`,
          transform: `scaleX(${hemingwayDirection === 'right' ? 1 : -1})`,
          animation: hemingwayIsShooting ? 'hemingway-shoot 0.2s' : 'hemingway-idle 1s infinite'
        }}></div>
        
        {enemies.map(enemy => (
          <div key={enemy.id} className={`enemy ${enemy.type}`} style={{ 
            left: `${enemy.x}px`, 
            top: `${enemy.y}px`,
            transform: `scaleX(${enemy.direction === 'right' ? 1 : -1})`
          }}></div>
        ))}
        
        {bullets.map(bullet => (
          <div key={bullet.id} className={`bullet ${bullet.shooter}`} style={{ 
            left: `${bullet.x}px`, 
            top: `${bullet.y}px`
          }}></div>
        ))}
        
        {platforms.map((platform, index) => (
          <div key={`platform-${index}`} className={`platform ${platform.type}`} style={{ 
            left: `${platform.x}px`, 
            top: `${platform.y}px`,
            width: `${platform.width}px`,
            height: `${platform.height}px`
          }}></div>
        ))}
        
        {items.filter(item => !item.collected).map((item, index) => (
          <div key={`item-${index}`} className={`item ${item.type}`} style={{ 
            left: `${item.x}px`, 
            top: `${item.y}px`
          }}></div>
        ))}
        
        {bossActive && (
          <div className="boss" style={{ 
            left: `${bossPosition.x}px`, 
            top: `${bossPosition.y}px`
          }}></div>
        )}
      </div>
      
      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-content">
            <h2>Game Over</h2>
            <p>Your score: {score}</p>
            <button onClick={handleExit}>Exit</button>
            <button onClick={startGame}>Try Again</button>
          </div>
        </div>
      )}
      
      {victory && (
        <div className="victory-overlay">
          <div className="victory-content">
            <h2>Victory!</h2>
            <p>Congratulations! You've completed Level 4 with Ernest Hemingway.</p>
            <p>Your score: {score}</p>
            <button onClick={handleComplete}>Continue</button>
          </div>
        </div>
      )}
      
      {!isGameActive && !gameOver && !victory && (
        <div className="intro-overlay">
          <div className="intro-content">
            <h2>Level 4: The Hemingway Challenge</h2>
            <p>Fight alongside Ernest Hemingway in this thrilling side-scrolling adventure!</p>
            <p>Use arrow keys to move, space to shoot, and work together with Hemingway to defeat enemies.</p>
            <button onClick={startGame}>Begin Adventure</button>
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