#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function verifyNPCs() {
  log('\n🔍 NPC Verification Report', 'bright');
  log('==========================\n', 'bright');

  try {
    // Read GameData.js
    const gameDataPath = join(__dirname, '../client/src/components/GameData.js');
    const gameDataContent = readFileSync(gameDataPath, 'utf8');

    // Extract NPC data
    const npcMatches = gameDataContent.match(/npcs:\s*\[([\s\S]*?)\]/g);
    
    if (!npcMatches) {
      log('❌ No NPC arrays found in GameData.js', 'red');
      return false;
    }

    log(`📊 Found ${npcMatches.length} NPC arrays`, 'blue');

    let totalNPCs = 0;
    let validNPCs = 0;
    let issues = [];

    // Parse each NPC array
    npcMatches.forEach((npcArray, mapIndex) => {
      log(`\n🗺️ Map ${mapIndex + 1}:`, 'cyan');
      
      // Extract individual NPCs
      const npcRegex = /{[\s\S]*?}/g;
      const npcs = npcArray.match(npcRegex);
      
      if (!npcs) {
        log('  ⚠️ No NPCs found in this map', 'yellow');
        return;
      }

      npcs.forEach((npcStr, npcIndex) => {
        totalNPCs++;
        
        try {
          // Extract NPC properties
          const nameMatch = npcStr.match(/name:\s*["']([^"']+)["']/);
          const typeMatch = npcStr.match(/type:\s*([^,}\s]+)/);
          const positionMatch = npcStr.match(/position:\s*{\s*x:\s*(\d+),\s*y:\s*(\d+)\s*}/);
          
          if (!nameMatch || !typeMatch || !positionMatch) {
            issues.push(`NPC ${npcIndex + 1} in Map ${mapIndex + 1}: Missing required properties`);
            return;
          }

          const name = nameMatch[1];
          const type = typeMatch[1];
          const x = parseInt(positionMatch[1]);
          const y = parseInt(positionMatch[2]);

          // Validate position (should be tile coordinates, not pixel coordinates)
          if (x > 20 || y > 20) {
            issues.push(`${name}: Position (${x}, ${y}) appears to be in pixel coordinates`);
            return;
          }

          log(`  ✅ ${name} (${type}) at (${x}, ${y})`, 'green');
          validNPCs++;

        } catch (error) {
          issues.push(`NPC ${npcIndex + 1} in Map ${mapIndex + 1}: Parse error`);
        }
      });
    });

    // Check NPC sprite files
    log('\n🖼️ Checking NPC sprite files...', 'blue');
    const spriteFiles = [
      'shakespeare.webp',
      'artist.svg',
      'michelangelo.svg',
      'ada_lovelace.png',
      'lord_byron.webp',
      'oscar_wilde.svg',
      'alexander_pope.svg',
      'zeus.svg',
      'john_muir.png',
      'jesus.png'
    ];

    const spritePath = join(__dirname, '../client/public/assets/npcs/');
    let missingSprites = [];

    spriteFiles.forEach(sprite => {
      try {
        readFileSync(join(spritePath, sprite));
        log(`  ✅ ${sprite}`, 'green');
      } catch (error) {
        log(`  ❌ ${sprite} (missing)`, 'red');
        missingSprites.push(sprite);
      }
    });

    // Summary
    log('\n📋 Verification Summary', 'bright');
    log('=====================', 'bright');
    log(`Total NPCs found: ${totalNPCs}`, 'cyan');
    log(`Valid NPCs: ${validNPCs}`, validNPCs === totalNPCs ? 'green' : 'yellow');
    log(`Issues found: ${issues.length}`, issues.length === 0 ? 'green' : 'red');
    log(`Missing sprites: ${missingSprites.length}`, missingSprites.length === 0 ? 'green' : 'red');

    if (issues.length > 0) {
      log('\n⚠️ Issues Found:', 'yellow');
      issues.forEach(issue => log(`  • ${issue}`, 'red'));
    }

    if (missingSprites.length > 0) {
      log('\n❌ Missing Sprite Files:', 'red');
      missingSprites.forEach(sprite => log(`  • ${sprite}`, 'red'));
    }

    if (validNPCs === totalNPCs && issues.length === 0 && missingSprites.length === 0) {
      log('\n🎉 All NPCs are properly configured and visible!', 'green');
      return true;
    } else {
      log('\n⚠️ Some issues need to be addressed.', 'yellow');
      return false;
    }

  } catch (error) {
    log(`❌ Error during verification: ${error.message}`, 'red');
    return false;
  }
}

// Run verification
const success = verifyNPCs();
process.exit(success ? 0 : 1); 