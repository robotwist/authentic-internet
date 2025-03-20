/**
 * Debug Tools for Authentic Internet Game
 * 
 * Utility functions to help diagnose issues with game rendering and assets
 */

/**
 * Verify NPC sprites by attempting to load each one and reporting any failures
 * @param {Array} npcs - Array of NPC objects
 * @param {boolean} logSuccesses - Whether to log successful sprite loads
 * @returns {Promise<Array>} - Promise resolving to array of problem NPCs
 */
export const verifyNPCSprites = async (npcs, logSuccesses = false) => {
  if (!npcs || !npcs.length) {
    console.error('No NPCs provided to verify');
    return [];
  }
  
  const problemNPCs = [];
  
  for (const npc of npcs) {
    // Determine sprite URL based on NPC type
    let spriteUrl = npc.sprite;
    
    if (!spriteUrl) {
      // Fallback for missing sprite URL
      const type = typeof npc.type === 'string' ? npc.type.toLowerCase() : npc.type;
      
      switch (type) {
        case 'shakespeare':
        case 1:
          spriteUrl = '/assets/npcs/shakespeare.webp';
          break;
        case 'artist':
        case 2:
          spriteUrl = '/assets/npcs/artist.svg';
          break;
        case 'ada_lovelace':
        case 3:
          spriteUrl = '/assets/npcs/ada_lovelace.png';
          break;
        case 'lord_byron':
        case 4:
          spriteUrl = '/assets/npcs/lord_byron.webp';
          break;
        case 'oscar_wilde':
        case 5:
          spriteUrl = '/assets/npcs/oscar_wilde.svg';
          break;
        case 'alexander_pope':
        case 6:
          spriteUrl = '/assets/npcs/alexander_pope.svg';
          break;
        case 'zeus':
        case 7:
          spriteUrl = '/assets/npcs/zeus.svg';
          break;
        case 'john_muir':
        case 8:
          spriteUrl = '/assets/npcs/john_muir.png';
          break;
        case 'jesus':
        case 9:
          spriteUrl = '/assets/npcs/jesus.png';
          break;
        default:
          spriteUrl = '/assets/npcs/guide.png';
          break;
      }
    }
    
    try {
      const loadResult = await loadImage(spriteUrl);
      if (logSuccesses) {
        console.log(`✅ NPC sprite loaded: ${spriteUrl} for ${npc.name || 'Unknown NPC'}`);
      }
    } catch (error) {
      console.error(`❌ Failed to load sprite for NPC: ${npc.name || 'Unknown NPC'} - ${spriteUrl}`);
      problemNPCs.push({
        npc,
        spriteUrl,
        error: error.message
      });
    }
  }
  
  return problemNPCs;
};

/**
 * Attempt to load an image and return a promise that resolves or rejects based on success
 * @param {string} url - URL of the image to load
 * @returns {Promise<HTMLImageElement>} - Promise resolving to loaded image
 */
export const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

/**
 * Logs details about the available NPC sprites in the game
 */
export const debugNPCSprites = () => {
  console.group('🎭 NPC Sprite Debug Information');
  console.log('Checking for NPC sprites in /assets/npcs/...');
  
  const knownSprites = [
    '/assets/npcs/shakespeare.webp',
    '/assets/npcs/artist.svg',
    '/assets/npcs/ada_lovelace.png',
    '/assets/npcs/lord_byron.webp',
    '/assets/npcs/oscar_wilde.svg',
    '/assets/npcs/alexander_pope.svg',
    '/assets/npcs/zeus.svg',
    '/assets/npcs/john_muir.png',
    '/assets/npcs/jesus.png',
    '/assets/npcs/guide.png'
  ];
  
  Promise.all(knownSprites.map(url => {
    return loadImage(url)
      .then(() => ({ url, exists: true }))
      .catch(() => ({ url, exists: false }));
  })).then(results => {
    results.forEach(result => {
      if (result.exists) {
        console.log(`✅ ${result.url} - Available`);
      } else {
        console.error(`❌ ${result.url} - Missing`);
      }
    });
    
    console.log('\nTo debug NPC rendering issues:');
    console.log('1. Check that sprite files exist in /assets/npcs/');
    console.log('2. Ensure the correct file extension is used (.png, .svg, .webp)');
    console.log('3. Verify that NPC objects in Constants.jsx have the correct type value');
    
    console.groupEnd();
  });
};

/**
 * Debug function that can be called from the browser console
 * to analyze and fix NPC rendering issues in the current game state
 */
export const fixNPCRendering = (gameWorld) => {
  if (!gameWorld) {
    console.error('Game world object not provided');
    return;
  }
  
  console.group('🔧 NPC Rendering Fix Tool');
  
  // Check current map index
  const currentMapIndex = gameWorld.state.currentMapIndex || 0;
  console.log(`Current map: ${currentMapIndex}`);
  
  // Get NPCs from current map
  const maps = window.MAPS || [];
  if (!maps.length || !maps[currentMapIndex]) {
    console.error('Maps data not available');
    console.groupEnd();
    return;
  }
  
  const npcs = maps[currentMapIndex].npcs || [];
  console.log(`Found ${npcs.length} NPCs on current map`);
  
  // Verify NPC sprites
  verifyNPCSprites(npcs, true).then(problemNPCs => {
    if (problemNPCs.length === 0) {
      console.log('✅ All NPC sprites are valid!');
    } else {
      console.error(`❌ Found ${problemNPCs.length} NPCs with invalid sprites.`);
      console.table(problemNPCs.map(item => ({
        Name: item.npc.name || 'Unknown',
        Type: item.npc.type,
        SpriteURL: item.spriteUrl,
        Error: item.error
      })));
      
      // Apply fixes to the game world
      console.log('Applying fixes...');
      
      // Force re-render of the map component
      if (gameWorld.forceUpdate) {
        gameWorld.forceUpdate();
        console.log('✅ Force re-rendered the map component');
      }
      
      console.log('Fixes applied. Check if NPCs are now visible.');
    }
    
    console.groupEnd();
  });
};

// Expose debug functions to the window object for console access
if (typeof window !== 'undefined') {
  window.gameDebug = {
    fixNPCRendering,
    debugNPCSprites,
    verifyNPCSprites
  };
  
  console.log('🛠️ Game debug tools loaded. Access via window.gameDebug in the console.');
} 